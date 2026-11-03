/**
 * Stackra file contract:
 * Purpose: `Statement`, the landing's statement: one large paragraph whose `*`-marked keywords are drawn in steel
 *          (`--accent`), with a list of short facts under it.
 * Boundary: composition of @stackra/ui only; every word comes in props. The marks become `strong` elements; nothing
 *           else in the text is read as syntax. On the page it draws in its own ruled band; inside another block (a
 *           bento grid) in that block's.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0165 (UI through @stackra/ui); STA-2041 (taste v2 §1 and §3).
 */
import { Text } from "@stackra/ui/react";
import type { ReactElement, ReactNode } from "react";

import { RuledBand } from "#react/ruled-band/ruled-band";
import type { StatementProps } from "#react/statement/statement.props";

/** `text` with each `*…*` span drawn in steel; an unpaired `*` and what follows it stay as written. */
function marked(text: string): ReactNode[] {
  const parts = text.split("*");
  const isPaired = parts.length % 2 === 1;
  return parts.map((part, index) => {
    if (index % 2 === 0) return part;
    if (!isPaired && index === parts.length - 1) return `*${part}`;
    return (
      // oxlint-disable-next-line react/no-array-index-key -- reason: the parts are one fixed split of `text`, so a part's place is its identity
      <strong key={index} className="font-[inherit] text-accent">
        {part}
      </strong>
    );
  });
}

/**
 * A paragraph with steel keywords and its facts.
 *
 * @example
 * <Statement text="Write an *action* once." facts={facts} />
 */
export function Statement({ text, facts, className }: StatementProps): ReactElement {
  return (
    <RuledBand>
      <div className={`flex max-w-3xl flex-col gap-6 ${className ?? ""}`}>
        <Text className="text-2xl font-semibold text-balance">{marked(text)}</Text>
        {facts && facts.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {facts.map((fact) => (
              <li key={fact}>
                <Text tone="muted">{fact}</Text>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </RuledBand>
  );
}
