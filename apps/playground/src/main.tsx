/**
 * Stackra file contract:
 * Purpose: browser entry of @figentra/playground: builds the route tree from `src/routes/` inside the playground
 *          shell and mounts it into #root. A stand-in for the entry and route tree gen writes (ADR 0295 decision 7).
 * Boundary: mounting only; pages live in their route folders. A new page is a route folder `routes/<name>/` whose
 *          path is `/<name>`, plus one line in PAGES; the e2e suite finds it by its folder.
 * Runtime: browser
 * Governing contract: ADR 0295 (decision 7); ADR 0294 (rule R12, decision 14); ADR 0302 (decision 5).
 */
import "./styles/app.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";

import { PlaygroundIcons } from "#src/components/playground-icons";
import { PlaygroundShell } from "#src/components/playground-shell";
import { Avatar } from "#src/routes/avatar/avatar";
import { AvatarRoute } from "#src/routes/avatar/avatar.route";
import { Badge } from "#src/routes/badge/badge";
import { BadgeRoute } from "#src/routes/badge/badge.route";
import { Button } from "#src/routes/button/button";
import { ButtonRoute } from "#src/routes/button/button.route";
import { Card } from "#src/routes/card/card";
import { CardRoute } from "#src/routes/card/card.route";
import { Chip } from "#src/routes/chip/chip";
import { ChipRoute } from "#src/routes/chip/chip.route";
import { CloseButton } from "#src/routes/close-button/close-button";
import { CloseButtonRoute } from "#src/routes/close-button/close-button.route";
import { Foundations } from "#src/routes/foundations/foundations";
import { FoundationsRoute } from "#src/routes/foundations/foundations.route";
import { Home } from "#src/routes/home/home";
import { HomeRoute } from "#src/routes/home/home.route";
import { Icon } from "#src/routes/icon/icon";
import { IconRoute } from "#src/routes/icon/icon.route";
import { IconButton } from "#src/routes/icon-button/icon-button";
import { IconButtonRoute } from "#src/routes/icon-button/icon-button.route";
import { Link } from "#src/routes/link/link";
import { LinkRoute } from "#src/routes/link/link.route";
import { Separator } from "#src/routes/separator/separator";
import { SeparatorRoute } from "#src/routes/separator/separator.route";
import { Skeleton } from "#src/routes/skeleton/skeleton";
import { SkeletonRoute } from "#src/routes/skeleton/skeleton.route";
import { Spinner } from "#src/routes/spinner/spinner";
import { SpinnerRoute } from "#src/routes/spinner/spinner.route";
import { StatusBadge } from "#src/routes/status-badge/status-badge";
import { StatusBadgeRoute } from "#src/routes/status-badge/status-badge.route";
import { Surface } from "#src/routes/surface/surface";
import { SurfaceRoute } from "#src/routes/surface/surface.route";
import { Typography } from "#src/routes/typography/typography";
import { TypographyRoute } from "#src/routes/typography/typography.route";

// shortcut: authored until stackra gen writes `.stackra/entry/browser.ts` and the route tree (STA-339); then delete
// this file, and index.html with it (gen writes both).
/**
 * The component pages, in navigation order; the navigation groups them by the category each route class names (see
 * `PageCategory`), and a page lists under its category in this order. A new component is one line here.
 */
const PAGES = [
  { route: FoundationsRoute, element: <Foundations /> },
  { route: IconRoute, element: <Icon /> },
  { route: TypographyRoute, element: <Typography /> },
  { route: ButtonRoute, element: <Button /> },
  { route: IconButtonRoute, element: <IconButton /> },
  { route: CloseButtonRoute, element: <CloseButton /> },
  { route: LinkRoute, element: <Link /> },
  { route: SurfaceRoute, element: <Surface /> },
  { route: CardRoute, element: <Card /> },
  { route: SeparatorRoute, element: <Separator /> },
  { route: ChipRoute, element: <Chip /> },
  { route: StatusBadgeRoute, element: <StatusBadge /> },
  { route: BadgeRoute, element: <Badge /> },
  { route: AvatarRoute, element: <Avatar /> },
  { route: SpinnerRoute, element: <Spinner /> },
  { route: SkeletonRoute, element: <Skeleton /> },
];

const links = PAGES.map(({ route }) => route);

const router = createBrowserRouter([
  {
    element: <PlaygroundShell pages={links} />,
    children: [
      { path: HomeRoute.path, element: <Home pages={links} /> },
      ...PAGES.map(({ route, element }) => ({ path: route.path, element })),
    ],
  },
]);

const root = document.getElementById("root");
if (!root) throw new Error("index.html is missing #root");

createRoot(root).render(
  <StrictMode>
    <PlaygroundIcons>
      <RouterProvider router={router} />
    </PlaygroundIcons>
  </StrictMode>,
);
