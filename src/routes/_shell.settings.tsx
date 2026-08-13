import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useDeleteMyAccount } from "@/hooks/useAuth";
import { useTranslation } from "@/i18n";
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
  const { t } = useTranslation();
  const [theme, setTheme] = useState("dark");
  const navigate = useNavigate();
  const deleteAccount = useDeleteMyAccount();

  const themeLabel = (v: string) => (v === "light" ? t.settings.light : t.settings.dark);

  const handleDeleteAccount = () => {
    deleteAccount.mutate(undefined, {
      onSuccess: () => navigate({ to: "/goodbye" }),
      onError: () => toast.error(t.settings.deleteFailed),
    });
  };

  return (
    <div>
      <PageHeader eyebrow={t.settings.eyebrow} title={t.settings.title} description={t.settings.description} />

      <div className="grid gap-6 max-w-3xl">
        <Card className="border-border/60">
          <CardHeader><CardTitle>{t.settings.appearance}</CardTitle></CardHeader>
          <CardContent>
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">{t.settings.theme}</Label>
            <RadioGroup value={theme} onValueChange={(v) => { setTheme(v); document.documentElement.classList.toggle("light", v === "light"); toast.success(t.settings.themeSwitched(themeLabel(v))); }} className="mt-3 grid grid-cols-2 gap-3">
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-card p-4 has-[[data-state=checked]]:border-primary">
                <RadioGroupItem value="dark" />
                <div>
                  <div className="font-medium">{t.settings.dark}</div>
                  <div className="text-xs text-muted-foreground">{t.settings.darkDescription}</div>
                </div>
              </label>
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-card p-4 has-[[data-state=checked]]:border-primary">
                <RadioGroupItem value="light" />
                <div>
                  <div className="font-medium">{t.settings.light}</div>
                  <div className="text-xs text-muted-foreground">{t.settings.lightDescription}</div>
                </div>
              </label>
            </RadioGroup>
          </CardContent>
        </Card>

        <Card className="border-destructive/40">
          <CardHeader><CardTitle className="text-destructive">{t.settings.dangerZone}</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">{t.settings.deleteAccountDescription}</div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">{t.settings.deleteAccount}</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t.settings.areYouSure}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t.settings.deleteAccountConfirm}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t.settings.cancel}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    disabled={deleteAccount.isPending}
                    className={buttonVariants({ variant: "destructive" })}
                  >
                    {deleteAccount.isPending ? t.settings.deleting : t.settings.deleteAccount}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
