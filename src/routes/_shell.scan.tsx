import { createFileRoute, Link } from "@tanstack/react-router";
import { Barcode, ScanEye } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
  soon?: boolean;
}

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
    title: "Barcode",
    description: "Camera or a photo of the UPC/EAN (the barcode) on the back cover. Best for collected editions and TPBs.",
  },
  {
    to: "/scan/cover",
    icon: ScanEye,
    title: "Cover image",
    description: "Matches a photo against known covers by image hash. Upload only — a shaky live camera isn't worth the false matches.",
  },
];

function ScanLanding() {
  return (
    <div>
      <PageHeader eyebrow="Add a comic" title="Scan" description="Pick how you want to identify it." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MODES.map((mode) => {
          const cardContent = (
            <Card
              className={cn(
                "h-full border-border/60 transition",
                mode.soon ? "opacity-60" : "cursor-pointer hover:border-primary/40",
              )}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <mode.icon className="h-6 w-6 text-primary" />
                  {mode.soon && (
                    <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                      Soon
                    </span>
                  )}
                </div>
                <CardTitle className="mt-2 font-display tracking-wide">{mode.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{mode.description}</CardContent>
            </Card>
          );
          return mode.soon ? (
            <div key={mode.to}>{cardContent}</div>
          ) : (
            <Link key={mode.to} to={mode.to}>
              {cardContent}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
