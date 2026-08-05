import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_shell/settings")({
  head: () => ({
    meta: [
      { title: "Settings · Comic Vault" },
      { name: "description", content: "Theme and account preferences." },
      { property: "og:title", content: "Settings — Comic Vault" },
      { property: "og:description", content: "Customize your Comic Vault experience." },
    ],
  }),
  component: Settings,
});

function Settings() {
  const [theme, setTheme] = useState("dark");

  return (
    <div>
      <PageHeader eyebrow="Preferences" title="Settings" description="Theme and account preferences." />

      <div className="grid gap-6 max-w-3xl">
        <Card className="border-border/60">
          <CardHeader><CardTitle>Appearance</CardTitle></CardHeader>
          <CardContent>
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Theme</Label>
            <RadioGroup value={theme} onValueChange={(v) => { setTheme(v); document.documentElement.classList.toggle("light", v === "light"); toast.success(`Switched to ${v} theme`); }} className="mt-3 grid grid-cols-2 gap-3">
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-card p-4 has-[[data-state=checked]]:border-primary">
                <RadioGroupItem value="dark" />
                <div>
                  <div className="font-medium">Dark</div>
                  <div className="text-xs text-muted-foreground">Ink black, Marvel red, DC blue.</div>
                </div>
              </label>
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-card p-4 has-[[data-state=checked]]:border-primary">
                <RadioGroupItem value="light" />
                <div>
                  <div className="font-medium">Light</div>
                  <div className="text-xs text-muted-foreground">Paper white, softer accents.</div>
                </div>
              </label>
            </RadioGroup>
          </CardContent>
        </Card>

        <Card className="border-destructive/40">
          <CardHeader><CardTitle className="text-destructive">Danger zone</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">Delete your account and all collection data. This cannot be undone.</div>
            <Button variant="destructive">Delete account</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
