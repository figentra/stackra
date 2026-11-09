/**
 * Stackra file contract:
 * Purpose: `FOOTER_TEMPLATE`, the `app/components/footer.tsx` of a generated Fumadocs site: the `DocsConfig.footer`
 *          link columns and social profiles under every page, or nothing when the config has no footer.
 * Boundary: a constant.
 * Runtime: isomorphic
 * Governing contract: ADR 0514 (decision 1); STA-2026 (`footer` unchanged in the DocsConfig).
 */

/** The emitted `app/components/footer.tsx`. */
export const FOOTER_TEMPLATE = `import site from "../site.json";

type Link = { readonly label: string; readonly href: string };

type FooterData = {
  readonly socials?: Readonly<Record<string, string>>;
  readonly links?: readonly { readonly header: string; readonly items: readonly Link[] }[];
};

export function Footer() {
  const footer = site.footer as FooterData | null;
  if (footer === null) return null;
  const socials = Object.entries(footer.socials ?? {});
  return (
    <footer className="mt-12 flex flex-wrap gap-8 border-t pt-6 text-sm text-fd-muted-foreground">
      {(footer.links ?? []).map((column) => (
        <nav key={column.header} aria-label={column.header}>
          <p className="mb-2 font-medium text-fd-foreground">{column.header}</p>
          <ul className="flex flex-col gap-1">
            {column.items.map((item) => (
              <li key={item.href}>
                <a href={item.href}>{item.label}</a>
              </li>
            ))}
          </ul>
        </nav>
      ))}
      {socials.length === 0 ? null : (
        <ul aria-label="Social profiles" className="flex gap-4">
          {socials.map(([network, href]) => (
            <li key={network}>
              <a href={href} className="capitalize">
                {network}
              </a>
            </li>
          ))}
        </ul>
      )}
    </footer>
  );
}
`;
