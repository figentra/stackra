/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/otp-input` (OTP input).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; wave 3a forms and pickers (owner approval 2026-10-28).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The OTP input entry of the component registry. */
export const FREE_OTP_INPUT: ComponentEntry = {
  slug: "otp-input",
  tier: "free",
  category: "inputs_and_forms",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "OtpInput",
  parts: ["OtpInput"],
  hero: {
    react: {
      pkg: "@heroui/react",
      slug: "input-otp",
      docsUrl: "https://www.heroui.com/docs/react/components/input-otp",
      sourceUrl:
        "https://github.com/heroui-inc/heroui/tree/v3/packages/react/src/components/input-otp",
    },
  },
  examples: [{ id: "basics", card: true }],
  related: ["free/text-field"],
  tokens: ["radius.field", "color.field"],
  haptics: [{ event: "change", style: "success" }],
  keywords: ["otp", "code", "verification", "sms"],
  status: "new",
};
