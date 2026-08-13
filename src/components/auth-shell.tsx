import { Link } from "@tanstack/react-router";
import { Mail, Zap } from "lucide-react";
import type { ReactNode } from "react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useTranslation } from "@/i18n";

const CONTACT_EMAIL = "comicvault.support@gmail.com";

export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
  const { t } = useTranslation();

  return (
    <div className="relative grid min-h-screen w-full lg:grid-cols-2">
      <div className="absolute right-4 top-4 z-10">
        <LanguageSwitcher />
      </div>
      <div className="relative hidden overflow-hidden lg:block" style={{ backgroundImage: "var(--gradient-hero)" }}>
        <div className="absolute inset-0 opacity-25 mix-blend-overlay" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)", backgroundSize: "8px 8px" }} />
        <div className="absolute -right-16 top-1/4 h-4 w-96 rotate-12 bg-white/30" />
        <div className="absolute -left-16 bottom-1/3 h-3 w-72 -rotate-12 bg-black/40" />
        <div className="relative flex h-full flex-col justify-between p-10 text-white">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-md bg-black/40">
              <Zap className="h-5 w-5" />
            </div>
            <div className="font-display text-2xl tracking-wide">Comic Vault</div>
          </Link>
          <div>
            <div className="font-display text-5xl leading-none tracking-wide whitespace-pre-line">{t.auth.heroTitle}</div>
            <p className="mt-4 max-w-md text-white/85">{t.auth.heroSubtitle}</p>
          </div>
        </div>
      </div>
      <main className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="grid h-9 w-9 place-items-center rounded-md bg-primary"><Zap className="h-4 w-4 text-primary-foreground" /></div>
            <span className="font-display text-xl tracking-wide">Comic Vault</span>
          </Link>
          <h1 className="font-display text-3xl tracking-wide">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-8 space-y-4">{children}</div>
          <div className="mt-8 text-center text-sm text-muted-foreground">{footer}</div>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground hover:text-primary"
          >
            <Mail className="h-3 w-3" />
            {t.common.contact}
          </a>
        </div>
      </main>
    </div>
  );
}
