import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset password · Longbox" },
      { name: "description", content: "Reset your Longbox password." },
      { property: "og:title", content: "Reset password — Longbox" },
      { property: "og:description", content: "We'll email you a reset link." },
    ],
  }),
  component: Forgot,
});

function Forgot() {
  return (
    <>
      <AuthShell
        title="Reset password"
        subtitle="We'll email you a reset link."
        footer={<Link to="/login" className="text-primary hover:underline">Back to sign in</Link>}
      >
        <form onSubmit={(e) => { e.preventDefault(); toast.success("Check your inbox for a reset link."); }} className="space-y-4">
          <div><Label>Email</Label><Input type="email" placeholder="peter@dailybugle.com" /></div>
          <Button type="submit" className="w-full">Send reset link</Button>
        </form>
      </AuthShell>
      <Toaster />
    </>
  );
}
