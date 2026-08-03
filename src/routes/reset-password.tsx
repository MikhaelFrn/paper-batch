import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { updateAuthUser } from "@/services/auth";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Choose a new password · Comic Vault" },
      {
        name: "description",
        content: "Create a new password for your Comic Vault account.",
      },
      {
        property: "og:title",
        content: "Choose a new password — Comic Vault",
      },
      {
        property: "og:description",
        content: "Create a new password for your account.",
      },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      await updateAuthUser({
        password,
      });

      toast.success("Your password has been updated.");

      navigate({ to: "/login" });
    } catch {
      toast.error("Unable to update your password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AuthShell
        title="Choose a new password"
        subtitle="Enter your new password below."
        footer={
          <Link
            to="/login"
            className="text-primary hover:underline"
          >
            Back to sign in
          </Link>
        }
      >
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div>
            <Label htmlFor="password">
              New password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              required
            />
          </div>

          <div>
            <Label htmlFor="confirmPassword">
              Confirm password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(e.target.value)
              }
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Updating..." : "Update password"}
          </Button>
        </form>
      </AuthShell>

      <Toaster />
    </>
  );
}