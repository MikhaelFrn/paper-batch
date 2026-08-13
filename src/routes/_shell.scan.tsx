import { createFileRoute, Link } from "@tanstack/react-router";
import { Barcode, ScanEye } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/i18n";

export const Route = createFileRoute("/_shell/scan")({
  head: () => ({
    meta: [
      { title: "Scan · Comic Vault" },
      { name: "description", content: "Add a comic by barcode or cover image." },
    ],
  }),
  component: ScanLanding,
});

interface ScanMode {
  to: string;
  icon: typeof Barcode;
  title: string;
  description: string;
}

function ScanLanding() {
  const { t } = useTranslation();

  // Each mode is its own page/UI, not a shared camera view with an internal
  // "which kind of scan is this" branch — running more than one live camera
  // setup at once (or juggling format-detection across barcode/cover logic in
  // one component) would just make the page laggy for no benefit, since a
  // user only ever wants one of these at a time anyway.
  //
  // Cover text (OCR) was tried and removed — even after tuning (SPARSE_TEXT
  // page segmentation, word-confidence + prominence filtering), Tesseract
  // couldn't reliably read stylized comic logos across camera, drop, deluxe
  // HC, TPB, or single-issue photos. The barcode scanner works far better in
  // practice; not worth keeping a mode that mostly returns nothing useful.
  const MODES: ScanMode[] = [
    {
      to: "/scan/barcode",
      icon: Barcode,
      title: t.scan.barcodeTitle,
      description: t.scan.barcodeDescription,
    },
    {
      to: "/scan/cover",
      icon: ScanEye,
      title: t.scan.coverTitle,
      description: t.scan.coverDescription,
    },
  ];

  return (
    <div>
      <PageHeader eyebrow={t.scan.landingEyebrow} title={t.scan.landingTitle} description={t.scan.landingDescription} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MODES.map((mode) => (
          <Link key={mode.to} to={mode.to}>
            <Card className="h-full cursor-pointer border-border/60 transition hover:border-primary/40">
              <CardHeader>
                <mode.icon className="h-6 w-6 text-primary" />
                <CardTitle className="mt-2 font-display tracking-wide">{mode.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{mode.description}</CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
