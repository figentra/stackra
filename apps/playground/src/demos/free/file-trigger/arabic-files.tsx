/**
 * Stackra file contract:
 * Purpose: the "arabic-files" demo of the web FileTrigger: Arabic and Latin file names side by side, each in its own direction.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); design-system gap inventory row 6.
 */
import { UploadList } from "@stackra/ui/react";

/** Mixed-script file names from a Riyadh branch (data, never translated). */
const FILES = [
  { id: "1", name: "فاتورة-المورد-١٠٤٢.pdf", size: 1_310_720, status: "done" },
  { id: "2", name: "قائمة-الطعام-رمضان.jpg", size: 3_145_728, status: "uploading", progress: 35 },
  { id: "3", name: "Z-report-2026-10-27.pdf", size: 98_304, status: "uploading" },
] as const;

/** FileTrigger: Arabic files. */
export default function ArabicFiles() {
  return <UploadList className="max-w-md" items={FILES} />;
}
