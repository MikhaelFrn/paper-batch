import { useTranslation } from "@/i18n";
import { cn } from "@/lib/utils";

/** A plain two-button toggle rather than a dropdown — with exactly two
 * languages, a dropdown just adds a click (open, then choose) for no
 * benefit; both options being always visible is more discoverable too. */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale, t } = useTranslation();

  return (
    <div
      role="group"
      aria-label={t.common.language}
      className={cn("inline-flex items-center rounded-md border border-border bg-background/80 p-0.5 text-xs backdrop-blur", className)}
    >
      <button
        type="button"
        onClick={() => setLocale("en")}
        aria-pressed={locale === "en"}
        aria-label={t.common.english}
        className={cn(
          "rounded px-2 py-1 font-medium transition-colors",
          locale === "en" ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground",
        )}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLocale("fr")}
        aria-pressed={locale === "fr"}
        aria-label={t.common.french}
        className={cn(
          "rounded px-2 py-1 font-medium transition-colors",
          locale === "fr" ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground",
        )}
      >
        FR
      </button>
    </div>
  );
}
