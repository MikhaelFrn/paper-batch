import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { useSignIn, useSignInWithGoogle } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in · Comic Vault" },
      { name: "description", content: "Sign in to your Comic Vault comic collection." },
      { property: "og:title", content: "Sign in — Comic Vault" },
      { property: "og:description", content: "Access your comic library." },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const { redirect: redirectTo } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const login = useSignIn();
  const signInWithGoogle = useSignInWithGoogle();
  const handleGoogleSignIn = () => {
    signInWithGoogle.mutate(undefined, {
      onError: () => toast.error("Couldn't start Google sign-in."),
    });
  };
  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
        await login.mutateAsync({
            email,
            password,
        });

        navigate({ to: redirectTo || "/" });

    } catch (error) {
        toast.error("Invalid email or password.");
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to open your vault."
      footer={<>New here? <Link to="/signup" className="text-primary hover:underline">Create an account</Link></>}
    >
      <form onSubmit={ handleSubmit } className="space-y-4">
        <div><Label>Email</Label><Input type="email" placeholder="peter@dailybugle.com" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div>
          <div className="flex items-center justify-between">
            <Label>Password</Label>
            <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-primary">Forgot?</Link>
          </div>
          <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}/>
        </div>
        <label className="flex items-center gap-2 text-sm"><Checkbox defaultChecked /> Keep me signed in</label>
        <Button type="submit" className="w-full" disabled={login.isPending} onChange={(e) => setPassword(e.target.value)}>{login.isPending ? "Signing in..." : "Sign in"}</Button>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={signInWithGoogle.isPending}
          onClick={handleGoogleSignIn}
        >
          {signInWithGoogle.isPending ? "Redirecting…" : "Continue with Google"}
        </Button>
      </form>
    </AuthShell>
  );
}
