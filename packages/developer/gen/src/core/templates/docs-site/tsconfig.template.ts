/**
 * Stackra file contract:
 * Purpose: `TSCONFIG_TEMPLATE`, the `tsconfig.json` of a generated Fumadocs site, which Vite reads for the JSX
 *          transform and module resolution of `app/`.
 * Boundary: a constant; nothing typechecks the site, which is gitignored output.
 * Runtime: isomorphic
 * Governing contract: ADR 0514 (decision 1); ADR 0295 (decision 5: gen writes every tool file); STA-2026.
 */

/** The emitted `tsconfig.json`. */
export const TSCONFIG_TEMPLATE = `{
  "include": ["app/**/*", "*.ts", ".react-router/types/**/*"],
  "compilerOptions": {
    "lib": ["DOM", "DOM.Iterable", "ES2023"],
    "types": ["node", "vite/client"],
    "target": "ES2023",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "rootDirs": [".", "./.react-router/types"],
    "verbatimModuleSyntax": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true
  }
}
`;
