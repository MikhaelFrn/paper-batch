// Minimal ambient typing for the native Barcode Detection API — not yet
// part of TypeScript's bundled DOM lib. Chrome/Android only as of 2026;
// Safari and Firefox don't implement it (see useBarcodeScanner.ts, which
// falls back to a zxing-based decoder there).
interface DetectedBarcode {
  readonly rawValue: string;
  readonly format: string;
}

interface BarcodeDetectorOptions {
  formats?: string[];
}

declare class BarcodeDetector {
  constructor(options?: BarcodeDetectorOptions);
  static getSupportedFormats(): Promise<string[]>;
  detect(source: CanvasImageSource): Promise<DetectedBarcode[]>;
}
