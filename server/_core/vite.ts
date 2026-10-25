import express, { type Express } from "express";
import fs from "node:fs";
import { type Server } from "node:http";
import { nanoid } from "nanoid";
import path from "node:path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";
import { getSeoPage, injectSeoHtml } from "../seo";

export async function setupVite(app: Express, server: Server) {
  const serverOptions = { middlewareMode: true, hmr: { server }, allowedHosts: true as const };
  const vite = await createViteServer({ ...viteConfig, configFile: false, server: serverOptions, appType: "custom" });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    const url = req.originalUrl;
    try {
      const clientTemplate = path.resolve(import.meta.dirname, "../..", "client", "index.html");
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(`src="/src/main.tsx"`, `src="/src/main.tsx?v=${nanoid()}"`);
      const page = await getSeoPage(url);
      const html = injectSeoHtml(template, page);
      const output = await vite.transformIndexHtml(url, html);
      res.status(page.status).set({ "Content-Type": "text/html; charset=utf-8", "Cache-Control": page.noindex ? "private, no-store" : "public, max-age=0" });
      if (page.noindex) res.setHeader("X-Robots-Tag", "noindex, nofollow");
      if (req.method === "HEAD") return res.end();
      res.end(output);
    } catch (error) {
      vite.ssrFixStacktrace(error as Error);
      next(error);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = process.env.NODE_ENV === "development"
    ? path.resolve(import.meta.dirname, "../..", "dist", "public")
    : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) console.error(`Could not find the build directory: ${distPath}, make sure to build the client first`);
  // Let the route-aware fallback, not express.static's implicit index.html, own page requests.
  app.use(express.static(distPath, { index: false }));
  app.use("*", async (req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    try {
      const template = await fs.promises.readFile(path.resolve(distPath, "index.html"), "utf-8");
      const page = await getSeoPage(req.originalUrl);
      const html = injectSeoHtml(template, page);
      res.status(page.status).set({ "Content-Type": "text/html; charset=utf-8", "Cache-Control": page.noindex ? "private, no-store" : "public, max-age=0" });
      if (page.noindex) res.setHeader("X-Robots-Tag", "noindex, nofollow");
      if (req.method === "HEAD") return res.end();
      res.end(html);
    } catch (error) {
      next(error);
    }
  });
}
