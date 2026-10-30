/**
 * Stackra file contract:
 * Purpose: proves the landing hero's pick per visit: a first visit's random pick, kept for the rest of the visit and
 *          as the device's `last`; a return visit's next hero in turn; `?hero=` winning (and kept); a pick from the
 *          Display menu announced and kept; and a browser that refuses storage still getting a hero.
 * Boundary: jsdom's sessionStorage and localStorage, cleared per test; a fixed random number and date.
 * Runtime: browser
 * Governing contract: owner decision 2026-10-28 (a random first hero, then each return visit the next in turn);
 *          ADR 0022 (test placement).
 */
import { chooseHero } from "#src/components/landing-hero/choose-hero.function";
import { HERO_VISIT } from "#src/components/landing-hero/hero-visit.constant";
import { visitHero } from "#src/components/landing-hero/visit-hero.function";
import { HEROES } from "#src/constants/heroes.constant";

const NOW = new Date("2026-10-28T12:00:00Z");

/** A new visit on the same device: the tab's storage is gone, the device's stays. */
const newVisit = () => sessionStorage.clear();

afterEach(() => vi.restoreAllMocks());

describe("visitHero", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it("lists the three heroes in turn", () => {
    expect(HEROES.map(({ id }) => id)).toEqual(["stack", "storm", "mirror"]);
  });

  it("picks a first visit's hero at random and keeps it for the visit and as the device's last", () => {
    expect(visitHero("", 0.5, NOW)).toBe("storm");
    expect(sessionStorage.getItem(HERO_VISIT.session)).toBe("storm");
    expect(localStorage.getItem(HERO_VISIT.last)).toBe("storm");
    // The rest of the visit keeps it, whatever the dice say.
    expect(visitHero("", 0, NOW)).toBe("storm");
  });

  it("shows a returning visitor the next hero in turn, wrapping round", () => {
    expect(visitHero("", 0.9, NOW)).toBe("mirror");
    newVisit();
    expect(visitHero("", 0.9, NOW)).toBe("stack");
    newVisit();
    expect(visitHero("", 0.9, NOW)).toBe("storm");
  });

  it("lets ?hero= win over the visit's pick, and keeps it", () => {
    expect(visitHero("", 0, NOW)).toBe("stack");
    expect(visitHero("?scheme=dark&hero=mirror", 0, NOW)).toBe("mirror");
    expect(visitHero("", 0, NOW)).toBe("mirror");
    expect(localStorage.getItem(HERO_VISIT.last)).toBe("mirror");
  });

  it("ignores an unknown ?hero= and a stored id that is not a hero", () => {
    sessionStorage.setItem(HERO_VISIT.session, "gone");
    localStorage.setItem(HERO_VISIT.last, "gone");
    expect(visitHero("?hero=nope", 0, NOW)).toBe("stack");
  });

  it("still picks a hero when the browser refuses storage", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("denied", "SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("denied", "SecurityError");
    });
    expect(visitHero("", 0.5, NOW)).toBe("storm");
    expect(() => chooseHero("mirror")).not.toThrow();
  });
});

describe("chooseHero", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it("keeps the Display menu's pick for the visit and announces it", () => {
    const heard: string[] = [];
    const onPick = (event: Event) => heard.push((event as CustomEvent<string>).detail);
    window.addEventListener(HERO_VISIT.event, onPick);
    chooseHero("mirror");
    window.removeEventListener(HERO_VISIT.event, onPick);
    expect(heard).toEqual(["mirror"]);
    expect(visitHero("", 0, NOW)).toBe("mirror");
    expect(localStorage.getItem(HERO_VISIT.last)).toBe("mirror");
  });
});
