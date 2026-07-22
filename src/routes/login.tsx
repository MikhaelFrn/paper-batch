import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in · Longbox" },
      { name: "description", content: "Sign in to your Longbox comic collection." },
      { property: "og:title", content: "Sign in — Longbox" },
      { property: "og:description", content: "Access your comic library." },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to open your longbox."
      footer={<>New here? <Link to="/signup" className="text-primary hover:underline">Create an account</Link></>}
    >
      <form onSubmit={(e) => { e.preventDefault(); navigate({ to: "/" }); }} className="space-y-4">
        <div><Label>Email</Label><Input type="email" placeholder="peter@dailybugle.com" /></div>
        <div>
          <div className="flex items-center justify-between">
            <Label>Password</Label>
            <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-primary">Forgot?</Link>
          </div>
          <Input type="password" placeholder="••••••••" />
        </div>
        <label className="flex items-center gap-2 text-sm"><Checkbox defaultChecked /> Keep me signed in</label>
        <Button type="submit" className="w-full">Sign in</Button>
        <Button type="button" variant="outline" className="w-full">Continue with Google</Button>
      </form>
    </AuthShell>
  );
}
