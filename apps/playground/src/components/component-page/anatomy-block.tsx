/**
 * Stackra file contract:
 * Purpose: `AnatomyBlock`, the Anatomy section of a compound entry: the parts as a code block (root around its
 *          children) and one bullet per part.
 * Boundary: shown only when `entry.parts` has more than one; the code is `anatomyCode`'s, which Copy Markdown shares.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (row 5).
 */
import { anatomyCode } from "#src/components/component-page/anatomy-code.function";
import { CodeSnippet } from "#src/components/code-snippet/code-snippet";
import type { SectionProps } from "#src/components/component-page/section.props";

/** The parts of a compound entry. */
export function AnatomyBlock({ entry }: Pick<SectionProps, "entry">) {
  return (
    <div className="grid gap-3">
      <CodeSnippet code={anatomyCode(entry)} />
      <ul className="grid list-disc gap-1 ps-5">
        {entry.parts.map((part) => (
          <li key={part}>
            <code dir="ltr" className="font-mono text-sm">
              {part}
            </code>
          </li>
        ))}
      </ul>
    </div>
  );
}
