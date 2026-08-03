import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
import { requestPasswordReset } from "@/services/auth";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset password · Comic Vault" },
      { name: "description", content: "Reset your Comic Vault password." },
      { property: "og:title", content: "Reset password — Comic Vault" },
      { property: "og:description", content: "We'll email you a reset link." },
    ],
  }),
  component: Forgot,
});

function Forgot() {
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter your email address.");
      return;
    }

    try {
      await requestPasswordReset(email.trim());
      toast.success("Check your inbox for a reset link.");
    } catch {
      toast.error("Unable to send password reset email.");
    }
  };

  return (
    <>
      <AuthShell
        title="Reset password"
        subtitle="We'll email you a reset link."
        footer={
          <Link to="/login" className="text-primary hover:underline">
            Back to sign in
          </Link>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="peter@dailybugle.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full">
            Send reset link
          </Button>
        </form>
      </AuthShell>

      <Toaster />
    </>
  );
}
