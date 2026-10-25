# Feature Specification: Mobile navigation feels native: a search tab and a tab bar that minimizes on scroll

**Feature Branch**: `figentra/sta-429-mobile-navigation-feels-native-a-search-tab-beside-the-tab`

**Created**: 2026-10-25

**Status**: Implementing

**Linear**: STA-429

**Linear project**: none

**Clarifications status**: complete

**Analyze**: — <!-- lite lane: /speckit.analyze not run -->

**Input**: STA-429: on iOS 26 the system tab bar can set a search tab apart beside the bar and minimize while the
content scrolls. The mobile app's tab bar does neither. The web glass bar's scroll behaviour is the web session's part.

## Impact

- **Apps touched**: `apps/mobile` (the tab navigator, a Search screen, its route type and deep link, a shared search
  helper, the README)
- **Services touched**: none
- **Packages touched**: none
- **Workers touched**: none
- **Public contract change**: none
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: none
- **Secrets**: none
- **ADR needed**: no; it uses the system tab bar the app already has (`react-native-bottom-tabs`)
- **New dependencies**: none
- **Deploy modes**: every mode; native clients only
- **Licence tier**: the private app
- **UI surfaces**: the mobile tab bar; the Search tab in development builds
- **Docs to update**: `apps/mobile/README.md`
- **Lane**: lite (recorded reason: navigator options and one dev-only screen)
- **Change risk**: R1 (navigation chrome; no data, no credentials)

## User Scenarios & Testing

### User Story 1 - A person scrolls and searches the way iOS 26 does (Priority: P1)

A person scrolls a long page and the tab bar shrinks out of the way, then returns when they scroll back up. In a
development build they press the search button beside the tab bar, type a component name, and open its page.

**Independent Test**: on an iOS 26 device or simulator, scroll a review page and use the Search tab.

**Acceptance Scenarios**:

1. **Given** a long page, **When** the person scrolls down, **Then** the tab bar minimizes; scrolling up restores it.
2. **Given** the Search tab, **When** the person types "date", **Then** the date pages are listed and one press opens
   the page in the Home tab.

### Edge Cases

- **EC-01**: A release build has no review area, so it has no Search tab and no `stackra://search` link.
- **EC-02**: Before iOS 26, and on Android, the search tab is an ordinary tab and the bar does not minimize.

## Requirements

- **FR-001**: THE tab bar SHALL minimize while the content scrolls down (`minimizeBehavior: onScrollDown`).
- **FR-002**: Development builds SHALL have a Search tab in the search role whose header search filters the review
  pages with the landing's rule and opens a match in the Home tab.

## Success Criteria

- **SC-001**: Both scenarios hold on an iOS 26 device — verified by: manual

## Out of scope

- The web glass bar's scroll behaviour (the web design-system session's part of STA-429).
- A search over product content: the app has none yet.

## Assumptions

- `@bottom-tabs/react-navigation` 1.4.0 takes `minimizeBehavior` on the navigator and `role: "search"` on a screen.

## Status history

- 2026-10-25 · — → Draft · Claude (builder) · from STA-429 (lite lane)
- 2026-10-25 · Draft → Clarified · Claude (builder)
- 2026-10-25 · Clarified → Planned · Claude (builder)
- 2026-10-25 · Planned → Tasked · Claude (builder)
- 2026-10-25 · Tasked → Implementing · Claude (builder)
