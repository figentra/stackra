/**
 * Stackra file contract:
 * Purpose: proves every PageSkeleton layout has rows, that ids are unique inside their layout and row (they are React
 *          keys), that every bone carries a height, that no class uses a physical side (right-to-left must mirror by
 *          itself), and that the table layout is a toolbar, a header row and six body rows of four cells.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0313 (decision 6); ADR 0060 (RTL); ADR 0022 (test placement).
 */
// @covers sta-350:FR-148
import { PageSkeletonLayout } from "#contracts/enums/page-skeleton-layout.enum";
import { PAGE_SKELETON_ROWS } from "#core/constants/page-skeleton-rows.constant";

/** Classes that name a physical side or direction instead of the start and end. */
const PHYSICAL = /(^|\s)(-?(ml|mr|pl|pr|left|right)-|text-(left|right)|rounded-(l|r|tl|tr|bl|br)-)/;

describe("PAGE_SKELETON_ROWS", () => {
  it("has rows for exactly the layouts of the contract", () => {
    expect(Object.keys(PAGE_SKELETON_ROWS).sort()).toEqual([...PageSkeletonLayout].sort());
  });

  it.each(PageSkeletonLayout)("keeps the ids of the %s layout unique", (layout) => {
    const rows = PAGE_SKELETON_ROWS[layout];
    expect(rows.length).toBeGreaterThan(0);
    const ids = rows.map((row) => row.id);
    expect(new Set(ids).size, ids.join()).toBe(ids.length);
    for (const row of rows) {
      const boneIds = row.bones.map((bone) => bone.id);
      expect(row.bones.length, row.id).toBeGreaterThan(0);
      expect(new Set(boneIds).size, `${row.id}: ${boneIds.join()}`).toBe(boneIds.length);
    }
  });

  it("gives every bone a height and a shape, and none a physical side", () => {
    for (const layout of PageSkeletonLayout)
      for (const row of PAGE_SKELETON_ROWS[layout])
        for (const bone of row.bones) {
          expect(bone.className, `${layout}/${row.id}/${bone.id}`).toMatch(/(^|\s)h-\d/);
          expect(bone.className, `${layout}/${row.id}/${bone.id}`).toMatch(/(^|\s)rounded/);
          expect(bone.className).not.toMatch(PHYSICAL);
        }
  });

  it("draws a table as a toolbar, a header row and six body rows of four cells", () => {
    const [toolbar, head, ...body] = PAGE_SKELETON_ROWS.table;
    expect(toolbar?.id).toBe("toolbar");
    expect(head?.bones).toHaveLength(4);
    expect(body).toHaveLength(6);
    for (const row of body) expect(row.bones).toHaveLength(4);
  });
});
