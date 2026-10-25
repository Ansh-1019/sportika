import { ArrowRight, LogOut, ShieldCheck } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { useStore } from "@/lib/store";
import { usePageMeta } from "@/lib/seo";

const pageContent: Record<string, { title: string; eyebrow: string; description: string; action: string }> = {
  "/login": {
    title: "Sign in to SPORTIKA",
    eyebrow: "CUSTOMER ACCOUNT",
    description: "Continue with Manus to access your SPORTIKA account. Your identity and credentials are handled by Manus; SPORTIKA never asks for or stores your Manus password.",
    action: "Continue with Manus",
  },
  "/signup": {
    title: "Create your account",
    eyebrow: "JOIN SPORTIKA",
    description: "Customer registration is completed through Manus sign-in. Any account credentials or provider email verification stay with Manus, while SPORTIKA receives only the identity details the provider shares.",
    action: "Continue with Manus to sign up",
  },
  "/forgot-password": {
    title: "Password help",
    eyebrow: "MANUS ACCOUNT SUPPORT",
    description: "SPORTIKA does not store or reset Manus passwords. If Manus offers password recovery for your account, use the recovery option on its sign-in page.",
    action: "Open Manus sign-in",
  },
  "/reset-password": {
    title: "Reset your password with Manus",
    eyebrow: "PROVIDER-OWNED CREDENTIALS",
    description: "Password changes are managed by Manus, not by SPORTIKA. Continue to the Manus sign-in page and use its own account-recovery flow if it is available.",
    action: "Continue to Manus",
  },
};

export default function ProviderAuthPage({ path }: { path: string }) {
  const { user } = useStore();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const logout = trpc.auth.logout.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      toast.success("You are signed out of SPORTIKA.");
      setLocation("/");
    },
    onError: error => toast.error(error.message || "Sign-out failed. Please try again."),
  });
  const isLogout = path === "/logout";
  const content = pageContent[path] ?? pageContent["/login"]!;
  const pageTitle = isLogout ? "Sign out" : content.title;
  usePageMeta(`${pageTitle} | SPORTIKA`, "Secure SPORTIKA customer access through Manus. Passwords and recovery remain provider-managed.");

  const continueWithManus = () => {
    try {
      startLogin("/account");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Manus sign-in is not available right now.");
    }
  };

  return <section className="page-wrap content-page provider-auth-page">
    <div className="breadcrumbs"><Link href="/">Home</Link><span aria-hidden="true">/</span><span>{pageTitle}</span></div>
    <span className="eyebrow eyebrow-mark">{isLogout ? "SECURE SESSION" : content.eyebrow}</span>
    <h1>{pageTitle}<span className="brand-dot">.</span></h1>
    {isLogout ? <div className="form-card provider-auth-card">
      <p>{user ? `Sign out of SPORTIKA as ${user.email ?? user.name ?? "your account"}? This clears your SPORTIKA session and does not change your Manus account.` : "There is no active SPORTIKA session in this browser."}</p>
      {user ? <button className="btn-dark" type="button" onClick={() => logout.mutate()} disabled={logout.isPending}>
        <LogOut size={16}/>{logout.isPending ? "Signing out…" : "Sign out of SPORTIKA"}
      </button> : <Link href="/login" className="btn-dark">Go to sign in <ArrowRight size={16}/></Link>}
      <Link href="/" className="btn-outline">Return to the store</Link>
    </div> : <div className="form-card provider-auth-card">
      {user ? <>
        <p>You are signed in as <strong>{user.email ?? user.name ?? "a SPORTIKA customer"}</strong>.</p>
        <Link href="/account" className="btn-dark">Continue to your account <ArrowRight size={16}/></Link>
      </> : <>
        <p>{content.description}</p>
        <button className="btn-dark" type="button" onClick={continueWithManus}><ShieldCheck size={16}/>{content.action}</button>
        {(path === "/login" || path === "/signup") && <div className="provider-auth-links">
          {path === "/login" ? <><Link href="/signup">Create an account</Link><Link href="/forgot-password">Forgot password?</Link></> : <><Link href="/login">Already have an account? Sign in</Link><Link href="/forgot-password">Password help</Link></>}
        </div>}
        {(path === "/forgot-password" || path === "/reset-password") && <p className="admin-note">SPORTIKA cannot confirm, send or complete a password reset. Follow the options shown by Manus after continuing.</p>}
      </>}
    </div>}
  </section>;
}
