import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";

/** Centered single-line status text — loading, "not found", or any other
 * plain interstitial message that isn't worth its own layout. */
export function CenteredMessage({ message }: { message: string }) {
  return <div className="py-20 text-center text-sm text-muted-foreground">{message}</div>;
}

/** Centered "this doesn't exist" hero with a way back. */
export function NotFoundState({
  title,
  description,
  backTo,
  backLabel,
}: {
  title: string;
  description: string;
  backTo: string;
  backLabel: string;
}) {
  return (
    <div className="py-20 text-center">
      <div className="font-display text-4xl">{title}</div>
      <p className="mt-2 text-muted-foreground">{description}</p>
      <Link to={backTo} className="mt-4 inline-block text-marvel">{backLabel}</Link>
    </div>
  );
}

/** Dashed-border "nothing here yet" card. */
export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="grid place-items-center rounded-xl border border-dashed border-border py-20 text-center">
      <Icon className="mb-3 h-8 w-8 text-muted-foreground" />
      <div className="font-medium">{title}</div>
      <div className="text-sm text-muted-foreground">{description}</div>
    </div>
  );
}
