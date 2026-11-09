/**
 * Stackra file contract:
 * Purpose: `VITE_CONFIG_TEMPLATE`, the `vite.config.ts` of a generated Fumadocs site: the Fumadocs MDX plugin over
 *          `content/`, Tailwind and React Router in framework mode.
 * Boundary: a constant; the emitted text reads nothing but the site folder it sits in.
 * Runtime: isomorphic
 * Governing contract: ADR 0514 (decision 1: Fumadocs on Vite and React Router 7); ADR 0295 (decision 5); STA-2026.
 */

/** The emitted `vite.config.ts`. */
export const VITE_CONFIG_TEMPLATE = `import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { fumadocsMdx } from "fumadocs-mdx/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [fumadocsMdx(), tailwindcss(), reactRouter()],
});
`;
