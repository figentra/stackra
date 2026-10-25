# Tasks: Mobile navigation feels native: a search tab and a tab bar that minimizes on scroll

**Input**: `.agents/specs/sta-429-mobile-native-navigation/`

## Phase 1: User Story 1 - A person scrolls and searches the way iOS 26 does

- [x] T001 [US1] `minimizeBehavior` and the dev-only Search tab in `apps/mobile/src/navigation/tab-navigator.tsx`, with its route type and deep link — covers: FR-001, FR-002, P-001, EC-01, EC-02 — route: mobile
- [x] T002 [US1] The Search screen in `apps/mobile/src/screens/search-screen.tsx` on the shared `matchPages` rule — covers: FR-002, P-002, SC-001 — route: mobile — deps: T001
