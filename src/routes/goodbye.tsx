import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";

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
  return (
    <AuthShell
      title="Goodbye :("
      subtitle="Your account and everything in it have been permanently deleted."
      footer={<>Changed your mind? Creating a new account starts you with a clean vault.</>}
    >
      <div className="space-y-3">
        <Button asChild className="w-full">
          <Link to="/login">Log in</Link>
        </Button>
        <Button asChild variant="outline" className="w-full">
          <Link to="/signup">Sign up</Link>
        </Button>
      </div>
    </AuthShell>
  );
}
