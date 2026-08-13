import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/i18n";
import { toast } from "sonner";
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
  const { t } = useTranslation();
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error(t.auth.forgotPassword.missingEmail);
      return;
    }

    try {
      await requestPasswordReset(email.trim());
      toast.success(t.auth.forgotPassword.success);
    } catch {
      toast.error(t.auth.forgotPassword.error);
    }
  };

  return (
    <AuthShell
      title={t.auth.forgotPassword.title}
      subtitle={t.auth.forgotPassword.subtitle}
      footer={
        <Link to="/login" className="text-primary hover:underline">
          {t.auth.forgotPassword.backToSignIn}
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email">{t.auth.forgotPassword.emailLabel}</Label>
          <Input
            id="email"
            type="email"
            placeholder={t.auth.forgotPassword.emailPlaceholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <Button type="submit" className="w-full">
          {t.auth.forgotPassword.submit}
        </Button>
      </form>
    </AuthShell>
  );
}
