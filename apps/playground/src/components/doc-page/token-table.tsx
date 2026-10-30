/**
 * Stackra file contract:
 * Purpose: `TokenTable`, the design tokens an entry reads: the token name, the theme CSS variable it resolves to on web
 *          and a live sample (a colour swatch, a radius corner, or the variable's value), so a theme change shows here.
 * Boundary: presentation over `entry.tokens` and `tokenCssVar`; names and variables stay left to right.
 * Runtime: browser
 * Governing contract: STA-1371 (doc pages wave, 2026-10-28); ADR 0060 (tokens).
 */
import { tokenCssVar, type ComponentEntry } from "@stackra/showcase";
import { useCatalogueText } from "@stackra/ui/react";

import { DOC_PAGE_KEYS } from "#src/components/doc-page/doc-page-keys.constant";
import { MESSAGES } from "#src/constants/messages.constant";

const K = DOC_PAGE_KEYS.showcase.doc.ui;

/** The live sample of `token`. */
function Sample({
  token,
  cssVar,
}: {
  readonly token: string;
  readonly cssVar: string | undefined;
}) {
  if (!cssVar) return <span className="text-muted">—</span>;
  if (token.startsWith("color."))
    return (
      <span
        aria-hidden
        className="inline-block size-6 border border-separator"
        style={{ background: `var(${cssVar})` }}
      />
    );
  if (token.startsWith("radius."))
    return (
      <span
        aria-hidden
        className="inline-block size-6 border-s-2 border-t-2 border-accent"
        style={{ borderStartStartRadius: `var(${cssVar})` }}
      />
    );
  return <code dir="ltr" className="font-mono text-xs">{`var(${cssVar})`}</code>;
}

/** The token table of `entry`. */
export function TokenTable({ entry }: { readonly entry: ComponentEntry }) {
  const t = useCatalogueText(MESSAGES.en);
  if (entry.tokens.length === 0) return null;
  return (
    <table className="w-full border-collapse text-sm">
      <caption className="pb-2 text-start font-semibold">{t(K.token_table)}</caption>
      <thead>
        <tr className="border-b border-separator text-muted">
          <th scope="col" className="py-2 pe-4 text-start font-medium">
            {t(K.token)}
          </th>
          <th scope="col" className="py-2 pe-4 text-start font-medium">
            {t(K.css_var)}
          </th>
          <th scope="col" className="py-2 text-start font-medium">
            {t(K.swatch)}
          </th>
        </tr>
      </thead>
      <tbody>
        {entry.tokens.map((token) => {
          const cssVar = tokenCssVar(token);
          return (
            <tr key={token} className="border-b border-separator">
              <th scope="row" className="py-2 pe-4 text-start font-normal">
                <code dir="ltr" className="font-mono text-xs">
                  {token}
                </code>
              </th>
              <td className="py-2 pe-4">
                <code dir="ltr" className="font-mono text-xs">
                  {cssVar ?? "—"}
                </code>
              </td>
              <td className="py-2">
                <Sample token={token} cssVar={cssVar} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
