import { useEffect, useRef, useState } from "react";
// Type-only — erased at compile time, so this never triggers a runtime
// import of the CommonJS @zxing/library package (see createZxingReader).
import type { DecodeHintType } from "@zxing/library";

export type ScannerStatus = "idle" | "starting" | "scanning" | "error";

const CAMERA_CONSTRAINTS: MediaStreamConstraints = {
  video: { facingMode: "environment" },
};

// Product barcodes only — comics never carry QR/Aztec/PDF417/etc. Restricting
// formats matters for more than noise: zxing's MultiFormatReader runs every
// format's reader on every frame by default (QR, Micro QR, Data Matrix,
// Aztec, PDF417, MaxiCode, *and* 1D), which both slows decoding down and
// spams the console — several of those readers throw undocumented
// subclasses of ReaderException that a bug in this version's instanceof
// check (zxing/library MultiFormatReader.decodeInternal) misclassifies as
// unexpected and logs via console.warn on every single frame.
//
// Deliberately NOT setting TRY_HARDER: for 1D formats it makes OneDReader
// retry a failed decode by rotating the frame 90° (zxing/library's
// OneDReader.decode -> image.rotateCounterClockwise()), which calls into
// @zxing/browser's HTMLCanvasElementLuminanceSource.getTempCanvasElement()
// — and that throws "Could not create a Canvas element" every time in
// practice, discovered live. Since it fails unconditionally, TRY_HARDER
// currently buys nothing but noise and wasted work; the plain first-pass
// decode is unaffected and still runs every frame regardless.
const NATIVE_BARCODE_FORMATS = ["ean_13", "ean_8", "upc_a", "upc_e"];

/** Builds a zxing reader configured for product barcodes. Both @zxing/browser
 * and @zxing/library are loaded dynamically here, never at module scope —
 * this file is imported by the /scan route component, which is SSR-rendered,
 * and @zxing/library is a CommonJS module whose named exports Vite's SSR
 * module runner can't statically resolve. A static top-level import of it
 * crashes the *entire page's* server render, not just this feature (learned
 * the hard way — see the incident this comment replaced). */
async function createZxingReader() {
  const [{ BrowserMultiFormatReader }, zxing] = await Promise.all([
    import("@zxing/browser"),
    import("@zxing/library"),
  ]);
  const hints = new Map<DecodeHintType, unknown>([
    [
      zxing.DecodeHintType.POSSIBLE_FORMATS,
      [zxing.BarcodeFormat.EAN_13, zxing.BarcodeFormat.EAN_8, zxing.BarcodeFormat.UPC_A, zxing.BarcodeFormat.UPC_E],
    ],
  ]);
  return new BrowserMultiFormatReader(hints);
}

/** Scans for a UPC/EAN barcode via the device camera. Prefers the native
 * BarcodeDetector API (fast, zero-dependency) — Chrome and Android WebViews
 * as of 2026 — and falls back to zxing's pure-JS decoder for Safari/iOS and
 * Firefox, which still don't implement it (verified live, Feb 2026). Fires
 * `onDetect` at most once per activation, then stops the camera. */
export function useBarcodeScanner(active: boolean, onDetect: (code: string) => void) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [status, setStatus] = useState<ScannerStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const onDetectRef = useRef(onDetect);
  onDetectRef.current = onDetect;

  useEffect(() => {
    if (!active) {
      setStatus("idle");
      setError(null);
      return;
    }

    let cancelled = false;
    let hasDetected = false;
    let stream: MediaStream | null = null;
    let raf = 0;
    let zxingControls: { stop: () => void } | null = null;

    setStatus("starting");
    setError(null);

    const cleanup = () => {
      cancelAnimationFrame(raf);
      zxingControls?.stop();
      stream?.getTracks().forEach((track) => track.stop());
    };

    const detectOnce = (code: string) => {
      if (hasDetected) return;
      hasDetected = true;
      cleanup();
      onDetectRef.current(code);
    };

    const run = async () => {
      try {
        // navigator.mediaDevices only exists in a secure context (https://,
        // or localhost) — on plain http:// (e.g. testing over a LAN IP from
        // a phone) it's undefined, and calling .getUserMedia on it throws a
        // generic "Cannot read properties of undefined" with no indication
        // why. Catching that specific case up front gives a message that
        // actually explains it instead of raw JS internals.
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error(
            "Camera access needs a secure connection (https://) — this works once the site is properly hosted, but not over a plain network address.",
          );
        }
        stream = await navigator.mediaDevices.getUserMedia(CAMERA_CONSTRAINTS);
        if (cancelled || !videoRef.current) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        const video = videoRef.current;
        video.srcObject = stream;
        await video.play();
        if (cancelled) return;
        setStatus("scanning");

        if (typeof BarcodeDetector !== "undefined") {
          const detector = new BarcodeDetector({ formats: NATIVE_BARCODE_FORMATS });
          const tick = async () => {
            if (cancelled || hasDetected) return;
            try {
              const codes = await detector.detect(video);
              if (codes.length > 0) {
                detectOnce(codes[0].rawValue);
                return;
              }
            } catch {
              // Transient — an undecodable frame is normal, keep scanning.
            }
            raf = requestAnimationFrame(tick);
          };
          raf = requestAnimationFrame(tick);
        } else {
          const reader = await createZxingReader();
          if (cancelled) return;
          zxingControls = await reader.decodeFromStream(stream, video, (result) => {
            if (result) detectOnce(result.getText());
          });
          if (cancelled) zxingControls.stop();
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Couldn't access the camera.");
          setStatus("error");
        }
      }
    };

    run();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [active]);

  return { videoRef, status, error };
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Couldn't load that image."));
    img.src = url;
  });
}

/** Decodes a single still image (a photo of a barcode) rather than a live
 * stream — for laptops/webcams too low-res or unfocused for the live
 * scanner to pick anything up. Same format restriction as the live scanner;
 * returns null (not an error) when no barcode is found in the image, which
 * is a perfectly normal outcome for a bad photo. */
export async function decodeBarcodeFromImage(file: File): Promise<string | null> {
  const url = URL.createObjectURL(file);
  try {
    if (typeof BarcodeDetector !== "undefined") {
      const img = await loadImage(url);
      const detector = new BarcodeDetector({ formats: NATIVE_BARCODE_FORMATS });
      const codes = await detector.detect(img);
      return codes[0]?.rawValue ?? null;
    }

    const reader = await createZxingReader();
    try {
      const result = await reader.decodeFromImageUrl(url);
      return result.getText();
    } catch {
      return null;
    }
  } finally {
    URL.revokeObjectURL(url);
  }
}
