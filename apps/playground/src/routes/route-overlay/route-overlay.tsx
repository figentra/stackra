/**
 * Stackra file contract:
 * Purpose: the page of the route-overlay route: a small orders workbench that runs its own in-memory React Router, so
 *          each overlay is a real child route. It shows every presentation (modal, sheet, drawer, full screen), the
 *          locked overlay whose Escape, outside press and swipe are off until the page turns them on again, a `Link`
 *          that opens an overlay through `ReactRouterProvider`, and a live example: edit a name, Save completes the
 *          route, and Cancel with unsaved changes asks through `RouteLeaveConfirmation` before it closes. A status
 *          line shows the current in-memory route. All from `@stackra/navigation/react` and `@stackra/ui/react`.
 * Boundary: presentation only; strings in one `STRINGS` constant until @stackra/i18n. The memory router runs in a React
 *           root of its own (React Router refuses a router inside the playground's), keeps the playground's own
 *           address bar and history untouched, and is created once per visit of the page. The page
 *           has the one `h1`; the workbench below it uses only section headings. Triggers navigate with
 *           `state.returnTo`, so closing steps Back; one link shows the plain `Link` seam. Every string and class here
 *           is a stand-in a real app replaces with its own routes.
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 3 and 5); ADR 0317 (decisions 2 and 9); ADR 0312; ADR 0060 (light, dark,
 *          RTL); WCAG 2.2 SC 2.1.2, 2.4.3, 3.3.4 and 4.1.2.
 */
import type { OverlayPresentation, RouteOverlayState } from "@stackra/navigation/contracts";
import {
  ReactRouterProvider,
  RouteLeaveConfirmation,
  RouteOverlay as NavRouteOverlay,
  useRouteOverlay,
} from "@stackra/navigation/react";
import {
  Button,
  DesignSystemProvider,
  Heading,
  Link,
  Text,
  TextField,
  useDesignSystem,
} from "@stackra/ui/react";
import { StrictMode, useEffect, useRef, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  createMemoryRouter,
  Outlet,
  RouterProvider,
  useLocation,
  useNavigate,
  useOutletContext,
} from "react-router";

import { PageSection } from "#src/components/page-section";
import { PlaygroundIcons } from "#src/components/playground-icons";
import { RouteOverlayRoute } from "#src/routes/route-overlay/route-overlay.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::route-overlay.*` keys.
const STRINGS = {
  documentTitle: `${RouteOverlayRoute.title} · Stackra Playground`,
  intro:
    "A route overlay is a modal, sheet, drawer or full-screen page whose open state is the URL. It is the element of a child route: it is open while the route matches, and closing it navigates back. This page runs its own in-memory router, so the address bar of the playground does not change.",
  presentations: "Presentations",
  presentationsNote:
    "Each button navigates to a child route that draws the overlay one way. Close it with the close button, Escape or a press outside, and focus returns to the button.",
  openModal: "Open modal",
  openSheet: "Open sheet",
  openDrawer: "Open drawer",
  openFullScreen: "Open full screen",
  openByLink: "Open the modal through a Link",
  modalTitle: "Modal route",
  sheetTitle: "Sheet route",
  drawerTitle: "Drawer route",
  fullScreenTitle: "Full-screen route",
  body: "This is the page of a child route. The parent page stays mounted underneath, so its state survives.",
  close: "Close",
  cancel: "Cancel",
  dismissal: "Dismissal",
  dismissalNote:
    "A step the user must finish turns Escape, the outside press and the swipe off. The close button stays, so there is never a keyboard trap.",
  openLocked: "Open locked overlay",
  lockedTitle: "Locked route",
  lockedOn: "Escape and a press outside do nothing.",
  lockedOff: "Escape and a press outside close it again.",
  allow: "Allow dismissal",
  lock: "Lock dismissal",
  live: "Try it",
  liveNote:
    "Edit the name and Save, which completes the route. Cancel with unsaved changes asks before it leaves.",
  openEdit: "Edit name",
  editTitle: "Edit your name",
  nameLabel: "Name",
  save: "Save",
  savedName: "Saved name:",
  route: "Current route",
  routeNote: "The in-memory route changes as overlays open and close.",
  routeIs: "Route:",
  leaveTitle: "Discard unsaved changes?",
  leaveDescription: "Your edit to the name will be lost.",
  stay: "Stay on page",
  discard: "Discard changes",
} as const;

/** The list that lays triggers out in a wrapping row. */
const ROW = "flex flex-wrap items-center gap-4";

/** What the workbench shares with the overlay routes below it. */
interface WorkbenchContext {
  /** The saved name. */
  readonly name: string;
  /** Saves a new name. */
  readonly setName: (name: string) => void;
}

/** The history state every trigger puts on its navigation, so closing steps Back to the workbench. */
const RETURN_TO_WORKBENCH = { returnTo: "/" } satisfies RouteOverlayState;

/** A Cancel button for an overlay's footer; it closes the overlay it sits in. */
function CancelButton() {
  const { close } = useRouteOverlay();
  return (
    <Button variant="secondary" onPress={close}>
      {STRINGS.cancel}
    </Button>
  );
}

/** An overlay of one presentation with the standard body and a Cancel button. */
function Sample({
  presentation,
  title,
}: {
  readonly presentation: OverlayPresentation;
  readonly title: string;
}) {
  return (
    <NavRouteOverlay
      presentation={presentation}
      title={title}
      closeLabel={STRINGS.close}
      footer={<CancelButton />}
    >
      <Text>
        <bdi>{STRINGS.body}</bdi>
      </Text>
    </NavRouteOverlay>
  );
}

/** The body of the locked overlay: says whether dismissal is on and flips it. */
function LockedBody() {
  const { isDismissable, setDismissable } = useRouteOverlay();
  return (
    <div className="grid gap-3">
      <Text>
        <bdi>{isDismissable ? STRINGS.lockedOff : STRINGS.lockedOn}</bdi>
      </Text>
      <div>
        <Button variant="secondary" onPress={() => setDismissable(!isDismissable)}>
          {isDismissable ? STRINGS.lock : STRINGS.allow}
        </Button>
      </div>
    </div>
  );
}

/** The body of the live overlay: a name field, Save, and the leave confirmation while the name is edited. */
function EditBody() {
  const { name, setName } = useOutletContext<WorkbenchContext>();
  const { complete } = useRouteOverlay();
  const [draft, setDraft] = useState(name);
  const [isSaved, setIsSaved] = useState(false);
  const isDirty = draft !== name && !isSaved;

  // Completing waits for the render that clears `isDirty`, or the blocker would still hold the leave.
  useEffect(() => {
    if (isSaved) complete();
  }, [isSaved, complete]);

  return (
    <div className="grid gap-4">
      <TextField label={STRINGS.nameLabel} value={draft} onChange={setDraft} />
      <div>
        <Button
          isDisabled={!isDirty}
          onPress={() => {
            setName(draft);
            setIsSaved(true);
          }}
        >
          {STRINGS.save}
        </Button>
      </div>
      <RouteLeaveConfirmation
        when={isDirty}
        title={STRINGS.leaveTitle}
        description={STRINGS.leaveDescription}
        stayLabel={STRINGS.stay}
        discardLabel={STRINGS.discard}
      />
    </div>
  );
}

/** The parent page: the triggers, the live example's saved name, the current route and the outlet. */
function Workbench() {
  const navigate = useNavigate();
  const location = useLocation();
  const [name, setName] = useState("Ada Lovelace");
  const open = (path: string) => () => void navigate(path, { state: RETURN_TO_WORKBENCH });

  return (
    <div className="grid gap-10">
      <PageSection
        id="route-overlay-presentations"
        title={STRINGS.presentations}
        note={STRINGS.presentationsNote}
      >
        <ul className={ROW}>
          <li>
            <Button variant="secondary" onPress={open("/modal")}>
              {STRINGS.openModal}
            </Button>
          </li>
          <li>
            <Button variant="secondary" onPress={open("/sheet")}>
              {STRINGS.openSheet}
            </Button>
          </li>
          <li>
            <Button variant="secondary" onPress={open("/drawer")}>
              {STRINGS.openDrawer}
            </Button>
          </li>
          <li>
            <Button variant="secondary" onPress={open("/full-screen")}>
              {STRINGS.openFullScreen}
            </Button>
          </li>
          <li>
            <Link href="/modal" underline="always">
              {STRINGS.openByLink}
            </Link>
          </li>
        </ul>
      </PageSection>

      <PageSection
        id="route-overlay-dismissal"
        title={STRINGS.dismissal}
        note={STRINGS.dismissalNote}
      >
        <div>
          <Button variant="secondary" onPress={open("/locked")}>
            {STRINGS.openLocked}
          </Button>
        </div>
      </PageSection>

      <PageSection id="route-overlay-live" title={STRINGS.live} note={STRINGS.liveNote}>
        <div className="grid max-w-sm gap-3">
          <div>
            <Button onPress={open("/edit")}>{STRINGS.openEdit}</Button>
          </div>
          <Text>
            <bdi>{`${STRINGS.savedName} ${name}`}</bdi>
          </Text>
        </div>
      </PageSection>

      <PageSection id="route-overlay-route" title={STRINGS.route} note={STRINGS.routeNote}>
        <Text role="status">
          <bdi>{`${STRINGS.routeIs} ${location.pathname}`}</bdi>
        </Text>
      </PageSection>

      <Outlet context={{ name, setName } satisfies WorkbenchContext} />
    </div>
  );
}

/** The in-memory routes: the workbench, with each overlay as a child route, inside the `Link` seam. */
const ROUTES = [
  {
    element: (
      <ReactRouterProvider>
        <Outlet />
      </ReactRouterProvider>
    ),
    children: [
      {
        path: "/",
        element: <Workbench />,
        children: [
          { path: "modal", element: <Sample presentation="modal" title={STRINGS.modalTitle} /> },
          { path: "sheet", element: <Sample presentation="sheet" title={STRINGS.sheetTitle} /> },
          {
            path: "drawer",
            element: <Sample presentation="drawer" title={STRINGS.drawerTitle} />,
          },
          {
            path: "full-screen",
            element: <Sample presentation="full-screen" title={STRINGS.fullScreenTitle} />,
          },
          {
            path: "locked",
            element: (
              <NavRouteOverlay
                title={STRINGS.lockedTitle}
                closeLabel={STRINGS.close}
                isDismissable={false}
                footer={<CancelButton />}
              >
                <LockedBody />
              </NavRouteOverlay>
            ),
          },
          {
            path: "edit",
            element: (
              <NavRouteOverlay
                title={STRINGS.editTitle}
                closeLabel={STRINGS.close}
                footer={<CancelButton />}
              >
                <EditBody />
              </NavRouteOverlay>
            ),
          },
        ],
      },
    ],
  },
];

/** The workbench app: its in-memory router, made once for the life of the page so an open overlay survives a render. */
function WorkbenchApp() {
  const [router] = useState(() => createMemoryRouter(ROUTES, { initialEntries: ["/"] }));
  return <RouterProvider router={router} />;
}

/**
 * Hosts the workbench in a React root of its own. React Router refuses a router inside another, and the playground
 * already runs one, so the workbench cannot sit in this tree; its root takes the page's scheme, locale and icons.
 */
function WorkbenchHost() {
  const host = useRef<HTMLDivElement>(null);
  const root = useRef<Root | null>(null);
  const unmount = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const { colorScheme, locale, direction } = useDesignSystem();

  useEffect(() => {
    // A pending unmount from Strict Mode's rehearsal is called off, so the root is made once per container.
    clearTimeout(unmount.current);
    if (host.current) root.current ??= createRoot(host.current, { identifierPrefix: "workbench-" });
    // Later, not now: React refuses to unmount one root synchronously while it commits another.
    return () => {
      unmount.current = setTimeout(() => {
        root.current?.unmount();
        root.current = null;
      });
    };
  }, []);

  useEffect(() => {
    root.current?.render(
      <StrictMode>
        <PlaygroundIcons>
          <DesignSystemProvider colorScheme={colorScheme} locale={locale} direction={direction}>
            <WorkbenchApp />
          </DesignSystemProvider>
        </PlaygroundIcons>
      </StrictMode>,
    );
  }, [colorScheme, locale, direction]);

  return <div ref={host} />;
}

/** The Route overlay page. */
export function RouteOverlay() {
  return (
    <article className="grid gap-10">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <Heading level={1}>{RouteOverlayRoute.title}</Heading>
        <Text className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </Text>
      </header>
      <WorkbenchHost />
    </article>
  );
}
