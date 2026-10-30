/**
 * Stackra file contract:
 * Purpose: proves `pickerFor` gives no picker, without requiring the package, when the app binary lacks the Expo
 *          native module (a dev client built before the picker was added).
 * Boundary: test only; no native runtime.
 * Runtime: node (vitest)
 * Governing contract: design-system gap inventory (file trigger); ADR 0022 (test placement).
 */
import { pickerFor } from "#native/file-trigger/picker-for.function";

describe("pickerFor (native)", () => {
  it.each(["files", "photos", "camera"] as const)(
    "gives no %s picker without its native module",
    (source) => {
      expect(pickerFor(source)).toBeNull();
    },
  );
});
