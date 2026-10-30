/**
 * Stackra file contract:
 * Purpose: `RouteOverlayWorkbench`, the in-memory app the web Route overlay demos share: a workbench page whose
 *          triggers navigate to child routes that draw a modal, sheet, drawer, full-screen, locked or editing overlay,
 *          with closing stepping Back. `section` picks the triggers a demo shows.
 * Boundary: demo support, one folder below the demos so the demos glob does not list it. The workbench runs in a React
 *           root of its own: React Router refuses a router inside another, and the playground already runs one. Its
 *           root takes the page's scheme, locale, direction and icons. Every string and class here is a stand-in a real
 *           app replaces with its own routes. The stacked section nests three drawer routes (order, customer,
 *           address), each the child route of the one under it.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0317 (decisions 2 and 9) and its
 *          2026-10-28 amendment (stacked overlays); ADR 0312; ADR 0060 (light, dark, RTL); WCAG 2.2 SC 2.1.2, 2.4.3, 3.3.4 and 4.1.2.
 */
import type { I18nKey } from "@stackra/i18n";
import type { OverlayPresentation, RouteOverlayState } from "@stackra/navigation/contracts";
import {
  ReactRouterProvider,
  RouteLeaveConfirmation,
  RouteOverlay,
  useRouteOverlay,
} from "@stackra/navigation/react";
import {
  Button,
  DesignSystemProvider,
  Link,
  Text,
  TextField,
  useCatalogueText,
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

import { PlaygroundIcons } from "#src/components/playground-icons";
import { ShowcaseI18n } from "#src/components/showcase-i18n";
import { MESSAGES } from "#src/constants/messages.constant";
import { ROUTE_OVERLAY_KEYS } from "#src/demos/free/route-overlay/route-overlay-keys.constant";

/** The demos' keys. */
const K = ROUTE_OVERLAY_KEYS.route_overlay;

/** The triggers a demo shows. */
type Section = "presentations" | "dismissal" | "live" | "route" | "stacked";

/** The list that lays triggers out in a wrapping row. */
const ROW = "flex flex-wrap items-center gap-4";

/** What the workbench shares with the overlay routes below it. */
interface WorkbenchContext {
  /** The triggers to show. */
  readonly section: Section;
  /** The saved name. */
  readonly name: string;
  /** Saves a new name. */
  readonly setName: (name: string) => void;
}

/** The history state every trigger puts on its navigation, so closing steps Back to the workbench. */
const RETURN_TO_WORKBENCH = { returnTo: "/" } satisfies RouteOverlayState;

/** A Cancel button for an overlay's footer; it closes the overlay it sits in. */
function CancelButton() {
  const t = useCatalogueText(MESSAGES.en);
  const { close } = useRouteOverlay();
  return (
    <Button variant="secondary" onPress={close}>
      {t(K.cancel)}
    </Button>
  );
}

/** An overlay of one presentation with the standard body and a Cancel button. */
function Sample({
  presentation,
  title,
}: {
  readonly presentation: OverlayPresentation;
  readonly title: I18nKey;
}) {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <RouteOverlay
      presentation={presentation}
      title={t(title)}
      closeLabel={t(K.close)}
      footer={<CancelButton />}
    >
      <Text>
        <bdi>{t(K.body)}</bdi>
      </Text>
    </RouteOverlay>
  );
}

/** The locked overlay: says whether dismissal is on and flips it. */
function Locked() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <RouteOverlay
      title={t(K.locked_title)}
      closeLabel={t(K.close)}
      isDismissable={false}
      footer={<CancelButton />}
    >
      <LockedBody />
    </RouteOverlay>
  );
}

/** The body of the locked overlay. */
function LockedBody() {
  const t = useCatalogueText(MESSAGES.en);
  const { isDismissable, setDismissable } = useRouteOverlay();
  return (
    <div className="grid gap-3">
      <Text>
        <bdi>{t(isDismissable ? K.locked_off : K.locked_on)}</bdi>
      </Text>
      <div>
        <Button variant="secondary" onPress={() => setDismissable(!isDismissable)}>
          {t(isDismissable ? K.lock : K.allow)}
        </Button>
      </div>
    </div>
  );
}

/** The live overlay: a name field, Save, and the leave confirmation while the name is edited. */
function Edit() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <RouteOverlay title={t(K.edit_title)} closeLabel={t(K.close)} footer={<CancelButton />}>
      <EditBody />
    </RouteOverlay>
  );
}

/** The body of the live overlay. */
function EditBody() {
  const t = useCatalogueText(MESSAGES.en);
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
      <TextField label={t(K.name_label)} value={draft} onChange={setDraft} />
      <div>
        <Button
          isDisabled={!isDirty}
          onPress={() => {
            setName(draft);
            setIsSaved(true);
          }}
        >
          {t(K.save)}
        </Button>
      </div>
      <RouteLeaveConfirmation
        when={isDirty}
        title={t(K.leave_title)}
        description={t(K.leave_description)}
        stayLabel={t(K.stay)}
        discardLabel={t(K.discard)}
      />
    </div>
  );
}

/** One layer of the stacked demo: a drawer whose page opens the next layer, with the outlet the next layer draws in. */
function Layer({
  title,
  body,
  next,
}: {
  readonly title: I18nKey;
  readonly body: I18nKey;
  readonly next?: { readonly path: string; readonly label: I18nKey } | undefined;
}) {
  const t = useCatalogueText(MESSAGES.en);
  const navigate = useNavigate();
  return (
    <RouteOverlay
      presentation="drawer"
      title={t(title)}
      closeLabel={t(K.close)}
      footer={<CancelButton />}
    >
      <div className="grid gap-4">
        <Text>
          <bdi>{t(body)}</bdi>
        </Text>
        {next ? (
          <div>
            <Button variant="secondary" onPress={() => void navigate(next.path)}>
              {t(next.label)}
            </Button>
          </div>
        ) : null}
      </div>
      <Outlet />
    </RouteOverlay>
  );
}

/** The parent page: the section's triggers, its readout and the outlet. */
function Workbench({ section }: { readonly section: Section }) {
  const t = useCatalogueText(MESSAGES.en);
  const navigate = useNavigate();
  const location = useLocation();
  const [name, setName] = useState("Ada Lovelace");
  const open = (path: string) => () => void navigate(path, { state: RETURN_TO_WORKBENCH });

  return (
    <div className="grid gap-4">
      {section === "presentations" || section === "route" ? (
        <ul className={ROW}>
          <li>
            <Button variant="secondary" onPress={open("/modal")}>
              {t(K.open_modal)}
            </Button>
          </li>
          <li>
            <Button variant="secondary" onPress={open("/sheet")}>
              {t(K.open_sheet)}
            </Button>
          </li>
          <li>
            <Button variant="secondary" onPress={open("/drawer")}>
              {t(K.open_drawer)}
            </Button>
          </li>
          <li>
            <Button variant="secondary" onPress={open("/full-screen")}>
              {t(K.open_full_screen)}
            </Button>
          </li>
          {section === "presentations" ? (
            <li>
              <Link href="/modal" underline="always">
                {t(K.open_by_link)}
              </Link>
            </li>
          ) : null}
        </ul>
      ) : null}
      {section === "dismissal" ? (
        <div>
          <Button variant="secondary" onPress={open("/locked")}>
            {t(K.open_locked)}
          </Button>
        </div>
      ) : null}
      {section === "live" ? (
        <div className="grid max-w-sm gap-3">
          <div>
            <Button onPress={open("/edit")}>{t(K.open_edit)}</Button>
          </div>
          <Text>
            <bdi>{t(K.saved_name, { name })}</bdi>
          </Text>
        </div>
      ) : null}
      {section === "stacked" ? (
        <div>
          <Button variant="secondary" onPress={open("/order")}>
            {t(K.open_order)}
          </Button>
        </div>
      ) : null}
      {section === "route" || section === "stacked" ? (
        <Text role="status">
          <bdi>{t(K.route_is, { path: location.pathname })}</bdi>
        </Text>
      ) : null}
      <Outlet context={{ section, name, setName } satisfies WorkbenchContext} />
    </div>
  );
}

/** The in-memory routes of `section`: the workbench, with each overlay as a child route, inside the `Link` seam. */
function routesOf(section: Section) {
  return [
    {
      element: (
        <ReactRouterProvider>
          <Outlet />
        </ReactRouterProvider>
      ),
      children: [
        {
          path: "/",
          element: <Workbench section={section} />,
          children: [
            { path: "modal", element: <Sample presentation="modal" title={K.modal_title} /> },
            { path: "sheet", element: <Sample presentation="sheet" title={K.sheet_title} /> },
            { path: "drawer", element: <Sample presentation="drawer" title={K.drawer_title} /> },
            {
              path: "full-screen",
              element: <Sample presentation="full-screen" title={K.full_screen_title} />,
            },
            { path: "locked", element: <Locked /> },
            { path: "edit", element: <Edit /> },
            {
              path: "order",
              element: (
                <Layer
                  title={K.order_title}
                  body={K.order_body}
                  next={{ path: "customer", label: K.open_customer }}
                />
              ),
              children: [
                {
                  path: "customer",
                  element: (
                    <Layer
                      title={K.customer_title}
                      body={K.customer_body}
                      next={{ path: "address", label: K.open_address }}
                    />
                  ),
                  children: [
                    {
                      path: "address",
                      element: <Layer title={K.address_title} body={K.address_body} />,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ];
}

/** The workbench app: its in-memory router, made once so an open overlay survives a render. */
function WorkbenchApp({ section }: { readonly section: Section }) {
  const [router] = useState(() => createMemoryRouter(routesOf(section), { initialEntries: ["/"] }));
  return <RouterProvider router={router} />;
}

/** Hosts the workbench of `section` in a React root of its own, with the page's scheme, locale and icons. */
export function RouteOverlayWorkbench({ section }: { readonly section: Section }) {
  const host = useRef<HTMLDivElement>(null);
  const root = useRef<Root | null>(null);
  const unmount = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const { colorScheme, locale, direction } = useDesignSystem();

  useEffect(() => {
    // A pending unmount from Strict Mode's rehearsal is called off, so the root is made once per container.
    clearTimeout(unmount.current);
    if (host.current)
      root.current ??= createRoot(host.current, { identifierPrefix: `workbench-${section}-` });
    // Later, not now: React refuses to unmount one root synchronously while it commits another.
    return () => {
      unmount.current = setTimeout(() => {
        root.current?.unmount();
        root.current = null;
      });
    };
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- the section is the trigger: a new section re-runs the effect, which calls off the pending unmount and keeps one root per container
  }, [section]);

  useEffect(() => {
    root.current?.render(
      <StrictMode>
        <PlaygroundIcons>
          <DesignSystemProvider colorScheme={colorScheme} locale={locale} direction={direction}>
            <ShowcaseI18n locale={locale}>
              <WorkbenchApp section={section} />
            </ShowcaseI18n>
          </DesignSystemProvider>
        </PlaygroundIcons>
      </StrictMode>,
    );
  }, [colorScheme, locale, direction, section]);

  return <div ref={host} />;
}
