/**
 * Stackra file contract:
 * Purpose: the "arabic-files" demo of the native FileTrigger: Arabic and Latin file names in one list.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6);
 *          design-system gap inventory row 6.
 */
import { UploadList } from "@stackra/ui/native";

/** Mixed-script file names from a Riyadh branch (data, never translated). */
const FILES = [
  { id: "1", name: "فاتورة-المورد-١٠٤٢.pdf", size: 1_310_720, status: "done" },
  { id: "2", name: "قائمة-الطعام-رمضان.jpg", size: 3_145_728, status: "uploading", progress: 35 },
  { id: "3", name: "Z-report-2026-10-27.pdf", size: 98_304, status: "uploading" },
] as const;

/** Each name keeps its own direction. */
export default function ArabicFiles() {
  return <UploadList items={FILES} />;
}
