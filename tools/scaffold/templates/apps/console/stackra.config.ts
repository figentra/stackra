/**
 * Stackra file contract:
 * Purpose: the app definition of @figentra/{{NAME}}: identity and targets as static data that gen reads from the
 *          syntax tree without running it. The member key is derived from the package name; there is no key option.
 * Boundary: data only; no function, no environment read and no import of the app's own code.
 * Runtime: node
 * Governing contract: ADR 0295 (decisions 1 and 2); ADR 0294 (rule R12); ADR 0082 (API areas).
 */

// shortcut: plain data until @stackra/app ships defineApp, Target and ApiArea (STA-339); then
// `export default defineApp({ targets: [Target.Web], area: ApiArea.Admin, name: "{{TITLE}}" })`.
export default {
  targets: ["web"],
  area: "admin",
  name: "{{TITLE}}",
};
