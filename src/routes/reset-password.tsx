import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/i18n";
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
  const { t } = useTranslation();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (password.length < 8) {
      toast.error(t.auth.resetPassword.tooShort);
      return;
    }

    if (password !== confirmPassword) {
      toast.error(t.auth.resetPassword.mismatch);
      return;
    }

    try {
      setLoading(true);

      await updateAuthUser({
        password,
      });

      toast.success(t.auth.resetPassword.success);

      navigate({ to: "/login" });
    } catch {
      toast.error(t.auth.resetPassword.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={t.auth.resetPassword.title}
      subtitle={t.auth.resetPassword.subtitle}
      footer={
        <Link to="/login" className="text-marvel hover:underline">
          {t.auth.resetPassword.backToSignIn}
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="password">{t.auth.resetPassword.newPasswordLabel}</Label>
          <Input
            id="password"
            type="password"
            placeholder={t.auth.resetPassword.passwordPlaceholder}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="confirmPassword">{t.auth.resetPassword.confirmPasswordLabel}</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder={t.auth.resetPassword.passwordPlaceholder}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? t.auth.resetPassword.submitting : t.auth.resetPassword.submit}
        </Button>
      </form>
    </AuthShell>
  );
}
