import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create account · Longbox" },
      { name: "description", content: "Create your Longbox account and start tracking your collection." },
      { property: "og:title", content: "Create an account — Longbox" },
      { property: "og:description", content: "Start tracking your comic collection today." },
    ],
  }),
  component: Signup,
});

function Signup() {
  const navigate = useNavigate();
  return (
    <AuthShell
      title="Start your longbox"
      subtitle="Track every issue in a minute."
      footer={<>Already collecting? <Link to="/login" className="text-primary hover:underline">Sign in</Link></>}
    >
      <form onSubmit={(e) => { e.preventDefault(); navigate({ to: "/" }); }} className="space-y-4">
        <div><Label>Username</Label><Input placeholder="webhead" /></div>
        <div><Label>Email</Label><Input type="email" placeholder="peter@dailybugle.com" /></div>
        <div><Label>Password</Label><Input type="password" placeholder="At least 8 characters" /></div>
        <Button type="submit" className="w-full">Create account</Button>
        <p className="text-center text-xs text-muted-foreground">By continuing you agree to the Terms & Privacy.</p>
      </form>
    </AuthShell>
  );
}
