import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSignInWithGoogle, useSignUp } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create account · Comic Vault" },
      { name: "description", content: "Create your Comic Vault account and start tracking your collection." },
      { property: "og:title", content: "Create an account — Comic Vault" },
      { property: "og:description", content: "Start tracking your comic collection today." },
    ],
  }),
  component: Signup,
});

function Signup() {
  const navigate = useNavigate();
  const register = useSignUp();
  const signInWithGoogle = useSignInWithGoogle();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const handleGoogleSignIn = () => {
    signInWithGoogle.mutate(undefined, {
      onError: () => toast.error("Couldn't start Google sign-in."),
    });
  };
  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await register.mutateAsync({
        username,
        email,
        password,
      });
      toast.success("Account created!");
      navigate({ to: "/" });
    } catch (error) {
        toast.error("Invalid info provided.");
    }
  }
  
  return (
    <AuthShell
      title="Start your vault"
      subtitle="Track every issue in a minute."
      footer={<>Already collecting? <Link to="/login" className="text-primary hover:underline">Sign in</Link></>}
    >
      <form onSubmit={handleSubmit} className="space-y-4"> <div><Label>Username</Label><Input placeholder="username" value={username} onChange={(e) => setUsername(e.target.value)} /></div>
        <div><Label>Email</Label><Input type="email" placeholder="peter@dailybugle.com" value={email} onChange={(e) => setEmail(e.target.value)}/></div>
        <div><Label>Password</Label><Input type="password" placeholder="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)}/></div>
        <Button type="submit" className="w-full">Create account</Button>
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
