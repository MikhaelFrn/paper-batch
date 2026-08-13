import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslation } from "@/i18n";
import { useState } from "react";

/** Inline trigger (styled as a link, not a button) that opens the terms
 * dialog — meant to sit inside a sentence, e.g. "I accept the {trigger}".
 * Content is a placeholder until the real policy (still in legal review)
 * is ready to ship — see docs/legal-draft-privacy-and-terms.md. */
export function TermsDialog() {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={(e) => {
          // Prevents this click from also toggling the "I accept" checkbox
          // it's meant to sit inside — opening the dialog should be an
          // independent action, not implicitly a form of accepting.
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className="underline underline-offset-2 hover:text-primary"
      >
        {t.terms.linkText}
      </button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.terms.dialogTitle}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{t.terms.placeholderBody}</p>
      </DialogContent>
    </Dialog>
  );
}
