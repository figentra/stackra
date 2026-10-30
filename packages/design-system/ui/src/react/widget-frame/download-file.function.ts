/**
 * Stackra file contract:
 * Purpose: `downloadFile`, hands the browser a blob to save under `name`, through a temporary object URL and link.
 * Boundary: browser only; the URL is revoked once the click has been dispatched.
 * Runtime: browser
 * Governing contract: ADR 0307 (decisions 14 to 18); STA-1371.
 */

/** Saves `blob` as `name`. */
export function downloadFile(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.rel = "noopener";
  document.body.append(link);
  link.click();
  link.remove();
  // The click starts the download synchronously; revoking on the next task keeps Safari from cancelling it.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
