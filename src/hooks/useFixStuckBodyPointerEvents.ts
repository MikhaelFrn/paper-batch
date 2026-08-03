import { useEffect } from "react";

const OPEN_OVERLAY_SELECTOR =
  '[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]';

/** Radix Dialog sets `body { pointer-events: none }` while open, to trap
 * interaction. Nesting another Radix portal (e.g. a Select) inside a
 * Dialog can occasionally leave that style stuck after the dialog closes,
 * silently blocking every click on the page. This clears it whenever no
 * dialog is actually open. */
export function useFixStuckBodyPointerEvents() {
  useEffect(() => {
    const clearIfStuck = () => {
      if (
        document.body.style.pointerEvents === "none" &&
        !document.querySelector(OPEN_OVERLAY_SELECTOR)
      ) {
        document.body.style.pointerEvents = "";
      }
    };

    const observer = new MutationObserver(clearIfStuck);
    observer.observe(document.body, { attributes: true, attributeFilter: ["style"] });
    clearIfStuck();

    return () => observer.disconnect();
  }, []);
}
