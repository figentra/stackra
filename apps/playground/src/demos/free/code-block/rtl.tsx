/**
 * Stackra file contract:
 * Purpose: the "rtl" demo of the web CodeBlock: code inside an Arabic page: the header mirrors, the code stays left to right.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371.
 */
import { CodeBlock, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { CODE_BLOCK_KEYS } from "#src/demos/free/code-block/code-block-keys.constant";

/** The demo's keys. */
const K = CODE_BLOCK_KEYS.code_block;

/** The code shown, with an Arabic comment and string. */
const CODE = `// رسالة الترحيب في صفحة الدفع
export const greeting = { ar: "أهلاً بك", en: "Welcome" };`;

/** Code block: in an Arabic page the title and buttons mirror; the code reads left to right. */
export default function Rtl() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div dir="rtl" lang="ar" className="w-full">
      <CodeBlock code={CODE} title={t(K.rtl_title)} language="ts" showLineNumbers />
    </div>
  );
}
