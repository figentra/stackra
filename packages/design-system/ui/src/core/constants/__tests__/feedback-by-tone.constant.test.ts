/**
 * Stackra file contract:
 * Purpose: proves every tone has an icon and a role, and that only the tones a user must hear at once, warning and
 *          danger, are announced as `alert`; the rest wait as `status`, so a toast never interrupts a screen reader
 *          for good news.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0312; WCAG 2.2 SC 4.1.3 (status messages); ADR 0022 (test placement).
 */
// @covers sta-350:FR-096 sta-350:P-055
import { Tone } from "#contracts/enums/tone.enum";
import { FEEDBACK_BY_TONE } from "#core/constants/feedback-by-tone.constant";

describe("FEEDBACK_BY_TONE", () => {
  it("has an icon and a role for every tone", () => {
    expect(Object.keys(FEEDBACK_BY_TONE).sort()).toEqual([...Tone].sort());
    for (const tone of Tone) {
      expect(FEEDBACK_BY_TONE[tone].icon, tone).toBeTruthy();
    }
  });

  it("announces only warning and danger at once", () => {
    const alerts = Tone.filter((tone) => FEEDBACK_BY_TONE[tone].role === "alert");
    expect(alerts).toEqual(["warning", "danger"]);
  });
});
