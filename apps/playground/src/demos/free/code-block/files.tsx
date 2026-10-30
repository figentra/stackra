/**
 * Stackra file contract:
 * Purpose: the "files" demo of the web CodeBlock: several files as tabs.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371.
 */
import { CodeBlock } from "@stackra/ui/react";

/** The files shown, one tab each. */
const FILES = [
  {
    title: "checkout.tsx",
    language: "tsx",
    code: `export function Checkout({ total }: { total: number }) {
  return <Button variant="primary" onPress={() => pay(total)}>Pay</Button>;
}`,
  },
  {
    title: "orders.sql",
    language: "sql",
    code: `SELECT id, total FROM orders
WHERE status = 'paid' AND created_at > now() - interval '7 days';`,
  },
  {
    title: "app.yaml",
    language: "yaml",
    code: `name: checkout # the service
port: 3711
debug: false`,
  },
] as const;

/** Code block: three files, one tab each. */
export default function Files() {
  return <CodeBlock className="w-full" files={FILES} showLineNumbers />;
}
