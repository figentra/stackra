/**
 * Stackra file contract:
 * Purpose: the "text" demo of the web Typography: Each Text type, in Latin and in Arabic.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decisions 6, 7 and 9); ADR 0060 (right-to-left).
 */
import { TextType } from "@stackra/ui/contracts";
import { Text, useCatalogueText } from "@stackra/ui/react";
import type { ReactNode } from "react";
import { SHOWCASE_THEME } from "#src/constants/showcase-theme.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { TYPOGRAPHY_KEYS } from "#src/demos/free/typography/typography-keys.constant";

/** The demo's keys. */
const K = TYPOGRAPHY_KEYS.typography;

/** The locale tag before the Arabic metrics: a code, never translated. */
const STRINGS = { arabic: "ar" } as const;

/** The text tokens of the stackra theme, for the row labels. */
const TOKENS = SHOWCASE_THEME.typography;

/** The size and line height of a theme token, `40px/1.1`, or an empty string for a token the theme lacks. */
const metrics = (name: string) => {
  const style = TOKENS[name];
  return style ? `${style.size}/${style.lineHeight}` : "";
};

/** A row label: the token, its values, and its Arabic twin's values, isolated left to right. */
function TokenLabel({ prefix, token }: { prefix?: string; token: string }) {
  return (
    <Text type="caption" tone="muted">
      <bdi dir="ltr">
        {prefix ? `${prefix} · ` : ""}
        <code>{token}</code> · {metrics(token)} · {STRINGS.arabic} {metrics(`${token}-ar`)}
      </bdi>
    </Text>
  );
}

/** A list item of the type rows: label above, Latin and Arabic samples beside each other. */
function TypeRow({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <li className="grid gap-1 border-b border-separator pb-3">
      {label}
      <div className="grid gap-x-8 gap-y-2 md:grid-cols-2">{children}</div>
    </li>
  );
}

/** Typography: Text types. */
export default function TextDemo() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <ul className="grid gap-3">
      {TextType.map((type) => (
        <TypeRow key={type} label={<TokenLabel token={type} />}>
          <Text type={type} lang="en" data-testid={`text-${type}`}>
            {t(K.latin_sample)}
          </Text>
          <Text type={type} lang="ar" data-testid={`text-${type}-ar`}>
            {t(K.arabic_sample)}
          </Text>
        </TypeRow>
      ))}
    </ul>
  );
}
