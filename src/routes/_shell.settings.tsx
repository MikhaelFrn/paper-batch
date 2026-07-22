import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_shell/settings")({
  head: () => ({
    meta: [
      { title: "Settings · Longbox" },
      { name: "description", content: "Theme, notifications, and API integrations." },
      { property: "og:title", content: "Settings — Longbox" },
      { property: "og:description", content: "Customize your Longbox experience." },
    ],
  }),
  component: Settings,
});

function Settings() {
  const [theme, setTheme] = useState("dark");
  return (
    <div>
      <PageHeader eyebrow="Preferences" title="Settings" description="Theme, notifications, and integrations." />

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

        <Card className="border-border/60">
          <CardHeader><CardTitle>Notifications</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {[
              ["Weekly new arrivals digest", true],
              ["Wishlist availability alerts", true],
              ["Favorite series updates", false],
              ["Recommendations from creators you follow", true],
            ].map(([label, def]) => (
              <div key={label as string} className="flex items-center justify-between">
                <Label>{label}</Label>
                <Switch defaultChecked={def as boolean} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader><CardTitle>API integrations</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {["ComicVine", "Marvel API", "DC API", "League of Comic Geeks"].map((n) => (
              <div key={n} className="flex items-center justify-between rounded-md border border-border bg-muted/30 p-3">
                <div>
                  <div className="font-medium">{n}</div>
                  <div className="text-xs text-muted-foreground">Not connected</div>
                </div>
                <Button size="sm" variant="outline">Connect</Button>
              </div>
            ))}
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
