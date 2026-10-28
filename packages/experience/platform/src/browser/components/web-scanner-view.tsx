/**
 * Stackra file contract:
 * Purpose: `WebScannerView`, the web driver's scanner view: the rear camera in a `<video>`, decoded by the browser's
 *          `BarcodeDetector`, each code handed to `onBarcode`. `ScannerView` renders it on the web and PWA targets.
 * Boundary: opens the camera while mounted and stops every track on unmount. It decodes about four frames a second
 *           and does not de-duplicate: the page decides when to stop listening. Where the browser has no detector it
 *           renders the empty video box (the page shows its unavailable state from `scanner.isAvailable` first).
 * Runtime: browser
 * Governing contract: ADR 0250 (decision 2); ADR 0253.
 */
import { type CSSProperties, type ReactNode, useEffect, useRef } from "react";

import type { ScannerViewProps } from "#contracts/types/scanner-view-props.type";
import { BARCODE_DETECTOR_FORMATS } from "#browser/constants/barcode-detector-formats.constant";

/** The slice of the Shape Detection API this view uses (not in the DOM lib yet). */
type DetectorConstructor = new (options: { formats: string[] }) => {
  detect(source: HTMLVideoElement): Promise<readonly { readonly rawValue: string }[]>;
};

/** Milliseconds between two decode attempts. */
const DECODE_EVERY = 250;

/**
 * The camera view that decodes barcodes in the browser.
 *
 * @example
 * <WebScannerView formats={["ean13", "qr"]} onBarcode={(code) => lookUp(code)} />
 */
export function WebScannerView({
  formats,
  onBarcode,
  style,
  className,
}: ScannerViewProps): ReactNode {
  const video = useRef<HTMLVideoElement>(null);
  const handler = useRef(onBarcode);
  useEffect(() => {
    handler.current = onBarcode;
  });
  const names = (formats ?? []).map((format) => BARCODE_DETECTOR_FORMATS[format]).join(",");

  useEffect(() => {
    const Detector = (globalThis as { BarcodeDetector?: DetectorConstructor }).BarcodeDetector;
    const element = video.current;
    if (Detector === undefined || element === null) return;
    const detector = new Detector({
      formats: names === "" ? Object.values(BARCODE_DETECTOR_FORMATS) : names.split(","),
    });
    let stream: MediaStream | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;

    const decode = async (): Promise<void> => {
      if (stopped) return;
      if (element.readyState >= 2) {
        const [found] = await detector.detect(element).catch(() => []);
        if (found !== undefined && !stopped) handler.current(found.rawValue);
      }
      timer = setTimeout(() => void decode(), DECODE_EVERY);
    };

    void navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" }, audio: false })
      .then(async (opened) => {
        stream = opened;
        if (stopped) return;
        element.srcObject = opened;
        await element.play();
        await decode();
      })
      .catch(() => undefined); // a refused camera leaves the box empty; the page reads `scanner.permission`

    return () => {
      stopped = true;
      if (timer !== undefined) clearTimeout(timer);
      for (const track of stream?.getTracks() ?? []) track.stop();
    };
  }, [names]);

  return (
    <video
      ref={video}
      muted
      playsInline
      className={className}
      style={style as CSSProperties | undefined}
      data-testid="scanner-view"
    />
  );
}
