import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n";

export const Route = createFileRoute("/goodbye")({
  head: () => ({
    meta: [
      { title: "Goodbye · Comic Vault" },
      { name: "description", content: "Your Comic Vault account has been deleted." },
    ],
  }),
  component: Goodbye,
});

function Goodbye() {
  const { t } = useTranslation();
  return (
    <AuthShell
      title={t.auth.goodbye.title}
      subtitle={t.auth.goodbye.subtitle}
      footer={<>{t.auth.goodbye.footer}</>}
    >
      <div className="space-y-3">
        <Button asChild className="w-full">
          <Link to="/login">{t.auth.goodbye.logIn}</Link>
        </Button>
        <Button asChild variant="outline" className="w-full">
          <Link to="/signup">{t.auth.goodbye.signUp}</Link>
        </Button>
      </div>
    </AuthShell>
  );
}
