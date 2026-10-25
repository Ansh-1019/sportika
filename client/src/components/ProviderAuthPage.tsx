import { ArrowRight, Eye, EyeOff, LogOut, ShieldCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { useStore } from "@/lib/store";
import { usePageMeta } from "@/lib/seo";

const pageContent: Record<string, { title: string; eyebrow: string; description: string; action: string }> = {
  "/login": { title: "Sign in to SPORTIKA", eyebrow: "CUSTOMER ACCOUNT", description: "Use your SPORTIKA email and password to access your account.", action: "Sign in" },
  "/signup": { title: "Create your account", eyebrow: "JOIN SPORTIKA", description: "Create a SPORTIKA customer account to keep your cart, wishlist and order history together.", action: "Create account" },
  "/forgot-password": { title: "Password help", eyebrow: "ACCOUNT SUPPORT", description: "Password recovery is not available until a transactional email service is configured for this project.", action: "Back to sign in" },
  "/reset-password": { title: "Reset your password", eyebrow: "ACCOUNT SUPPORT", description: "Password reset links are not issued until a transactional email service is configured for this project.", action: "Back to sign in" },
};

function providerIsConfigured() {
  return typeof window !== "undefined" && Boolean(window.__MANUS_CONFIG__?.oauthPortalUrl && window.__MANUS_CONFIG__?.projectId);
}

export default function ProviderAuthPage({ path }: { path: string }) {
  const { user } = useStore();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [manusConfigured] = useState(providerIsConfigured);
  const logout = trpc.auth.logout.useMutation({
    onSuccess: async () => { await utils.auth.me.invalidate(); toast.success("You are signed out of SPORTIKA."); setLocation("/"); },
    onError: error => toast.error(error.message || "Sign-out failed. Please try again."),
  });
  const login = trpc.auth.login.useMutation({
    onSuccess: async () => { await utils.auth.me.invalidate(); toast.success("You are signed in."); setLocation("/account"); },
    onError: error => toast.error(error.message || "Sign-in failed. Please check your details."),
  });
  const register = trpc.auth.register.useMutation({
    onSuccess: async () => { await utils.auth.me.invalidate(); toast.success("Your SPORTIKA account is ready."); setLocation("/account"); },
    onError: error => toast.error(error.message || "Account creation failed. Please check your details."),
  });
  const isLogout = path === "/logout";
  const content = pageContent[path] ?? pageContent["/login"]!;
  const isSignup = path === "/signup";
  const isRecovery = path === "/forgot-password" || path === "/reset-password";
  const busy = login.isPending || register.isPending;
  const pageTitle = isLogout ? "Sign out" : content.title;
  usePageMeta(`${pageTitle} | SPORTIKA`, "Secure SPORTIKA customer access with provider-managed or local account authentication.");

  const continueWithManus = () => {
    try { startLogin("/account"); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Manus sign-in is not available right now."); }
  };

  const submitLocal = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    if (isSignup) {
      const name = String(data.get("name") ?? "").trim();
      const confirmation = String(data.get("passwordConfirmation") ?? "");
      if (password !== confirmation) { toast.error("Passwords do not match."); return; }
      register.mutate({ name, email, password });
    } else {
      login.mutate({ email, password });
    }
  };

  return <section className="page-wrap content-page provider-auth-page">
    <div className="breadcrumbs"><Link href="/">Home</Link><span aria-hidden="true">/</span><span>{pageTitle}</span></div>
    <span className="eyebrow eyebrow-mark">{isLogout ? "SECURE SESSION" : content.eyebrow}</span>
    <h1>{pageTitle}<span className="brand-dot">.</span></h1>
    {isLogout ? <div className="form-card provider-auth-card">
      <p>{user ? `Sign out of SPORTIKA as ${user.email ?? user.name ?? "your account"}? This clears your SPORTIKA session.` : "There is no active SPORTIKA session in this browser."}</p>
      {user ? <button className="btn-dark" type="button" onClick={() => logout.mutate()} disabled={logout.isPending}><LogOut size={16}/>{logout.isPending ? "Signing out…" : "Sign out of SPORTIKA"}</button> : <Link href="/login" className="btn-dark">Go to sign in <ArrowRight size={16}/></Link>}
      <Link href="/" className="btn-outline">Return to the store</Link>
    </div> : user ? <div className="form-card provider-auth-card">
      <p>You are signed in as <strong>{user.email ?? user.name ?? "a SPORTIKA customer"}</strong>.</p>
      <Link href="/account" className="btn-dark">Continue to your account <ArrowRight size={16}/></Link>
    </div> : manusConfigured ? <div className="form-card provider-auth-card">
      <p>{content.description}</p>
      <button className="btn-dark" type="button" onClick={continueWithManus}><ShieldCheck size={16}/>{isRecovery ? "Open Manus account support" : content.action}</button>
      {(path === "/login" || path === "/signup") && <div className="provider-auth-links">{path === "/login" ? <><Link href="/signup">Create an account</Link><Link href="/forgot-password">Forgot password?</Link></> : <><Link href="/login">Already have an account? Sign in</Link><Link href="/forgot-password">Password help</Link></>}</div>}
      {isRecovery && <p className="admin-note">SPORTIKA does not store provider passwords. Follow the recovery options shown by Manus.</p>}
    </div> : isRecovery ? <div className="form-card provider-auth-card">
      <p>{content.description}</p>
      <p className="admin-note">No reset email will be sent until an email provider and reset-token storage are configured. This page intentionally does not pretend recovery is active.</p>
      <Link href="/login" className="btn-dark">Back to sign in <ArrowRight size={16}/></Link>
    </div> : <div className="form-card provider-auth-card">
      <p>{content.description}</p>
      <form className="auth-form" onSubmit={submitLocal} noValidate>
        {isSignup && <label className="field"><span>Full name</span><input name="name" type="text" autoComplete="name" minLength={2} maxLength={80} required /></label>}
        <label className="field"><span>Email address</span><input name="email" type="email" autoComplete="email" maxLength={320} required /></label>
        <label className="field"><span>Password</span><span className="password-field"><input name="password" type={showPassword ? "text" : "password"} autoComplete={isSignup ? "new-password" : "current-password"} minLength={8} maxLength={128} required /><button type="button" className="password-toggle" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(value => !value)}>{showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button></span></label>
        {isSignup && <label className="field"><span>Confirm password</span><span className="password-field"><input name="passwordConfirmation" type={showConfirmation ? "text" : "password"} autoComplete="new-password" minLength={8} maxLength={128} required /><button type="button" className="password-toggle" aria-label={showConfirmation ? "Hide password confirmation" : "Show password confirmation"} onClick={() => setShowConfirmation(value => !value)}>{showConfirmation ? <EyeOff size={17}/> : <Eye size={17}/>}</button></span></label>}
        <button className="btn-dark" type="submit" disabled={busy}>{busy ? "Please wait…" : content.action} <ArrowRight size={16}/></button>
      </form>
      <div className="provider-auth-links">{isSignup ? <><Link href="/login">Already have an account? Sign in</Link><Link href="/forgot-password">Forgot password?</Link></> : <><Link href="/signup">Create an account</Link><Link href="/forgot-password">Forgot password?</Link></>}</div>
      <p className="admin-note">Passwords are hashed on the server and never stored in plain text. Password recovery requires a configured email service.</p>
    </div>}
  </section>;
}
