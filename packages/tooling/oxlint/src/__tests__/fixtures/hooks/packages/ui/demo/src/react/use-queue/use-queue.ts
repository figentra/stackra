// lint fixture (rules-of-hooks.test.ts): a hook that calls another hook conditionally; still reported.
// @boundaries-ignore lint fixture: oxlint only parses it; react is never resolved
import { useState } from "react";

export function useQueue(enabled = true): readonly string[] {
  if (!enabled) return [];
  const [items] = useState<readonly string[]>([]);
  return items;
}
