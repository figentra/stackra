# @stackra/navigation

Stackra navigation: the `Route`, `Layout` and `Menu` kinds, typed route refs, the route context a loader and a submit
receive, the native chrome config, the React Router 7 adapters for web and desktop, the React Navigation adapters for
mobile, the root error boundary and router-aware links. One term on every target: a mobile screen is a route with
native presentation options. The old `@stackra/router` package and its `./router` entry are folded in here.

**Tier:** `tier:lib` (`packages/experience/navigation`). Entries `.`, `./contracts`, `./react`, `./native` and
`./testing`. Depends on `@stackra/ui` (the boundary and context menu), `@stackra/iam` (`./react` navigation gating),
`@stackra/platform`, `@stackra/seo` (locale paths, the SEO chain, canonical redirects), `@stackra/clients`,
`@stackra/i18n`, `@stackra/settings`, `@stackra/feature-flags`, `@stackra/errors`, `@stackra/config`,
`@stackra/validation`, `@stackra/container`, `@stackra/contracts` and `@stackra/icons`. React Router (`./react`,
`./testing`), React Navigation with React Native (`./native`) and `@stackra/testing` (`./testing`) are optional peers.

## What is here

| Entry         | Symbol                                                                                           | Use                                                                                        |
| ------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| `.`           | `Route`, `Layout`, `Menu`                                                                        | the kind bases: `extends Route({ path, layout, ... })`, `extends Layout`, `Menu({ kind })` |
| `.`           | `routeRef`, `registerRoutes`                                                                     | gen's `Routes.<key>` refs and the route table that resolves them                           |
| `.`           | `RouteContext`, `LayoutContext`, `MetaContext`, `RouteProps`, `InferParams`, `RouteRef`          | types: `loader(ctx: RouteContext<this>)`, `Component<RouteProps<typeof XRoute>>`           |
| `.`           | `MenuBuilder`, `ResolvedMenuItem`, `MenuKind`, `MenuItemKind`                                    | a menu's `items(m)` and what a renderer draws                                              |
| `.`           | `ChromeConfig`, `ChromeConfig$`, `HeaderStyle`, `BackTitle`, `Presentation`, `RenderMode`        | native chrome, presentations and the web render mode                                       |
| `.`           | `data`, `navigation`, `tabs`                                                                     | data with a status; gen's navigation tree and tabs                                         |
| `.`           | `contributeRouteContext`, `RouteServices`, `registerDocumentResolver`                            | how other packages add context members and resolve `document:` routes                      |
| `./contracts` | `RouteCaller`                                                                                    | the port behind `ctx.query` and `ctx.action`                                               |
| `./react`     | `Link`, `NavLink`, `Outlet`, `RouteForm`, `useHref`, `useNavigate`, `useLocaleHref`              | router-aware links and navigation in the visitor's locale mount                            |
| `./react`     | `useMenu`, `useNavigation`, `useLayoutData`, `useSubmit`                                         | menus, the gated navigation tree (or the router state), layout data, a page's submit       |
| `./react`     | `RootErrorBoundary`                                                                              | the app-wide error boundary gen wires (ADR 0305 rule 35)                                   |
| `./react`     | `BreadcrumbsProvider`, `useBreadcrumb`, `useBreadcrumbs`, `Breadcrumb`                           | the breadcrumb trail a panel's shell holds and pages publish to                            |
| `./react`     | `toRoot`, `toLayout`, `toRoute`, `toPanel`, `toResource`, `toSettingsPage`, `registerRoutePages` | the data-route tree of a client-rendered app                                               |
| `./react`     | `routeAdapter`, `routeContext`                                                                   | framework-mode route modules on the Worker                                                 |
| `./native`    | `toScreen`, `useLayoutLoader`, `useNavigate`, `useRouteReload`, `ContextMenu`                    | the React Navigation tree, native navigation, pull to refresh, a value's context menu      |
| `./testing`   | `renderRoute`, `renderLayout`                                                                    | a route's page or a layout mounted under a router stub, with the parts' fakes              |
| `./testing`   | `runRouteLoader`, `runRouteSubmit`, `routeMeta`                                                  | one loader or submit run, or the head for some data, without a router                      |
| `./testing`   | `registerRouteTestingPart`, `createRoutesStub`                                                   | how another package's fakes take part; React Router's own stub                             |

## Declaring a route

```ts
// src/routes/settings/settings.route.ts
export class SettingsRoute extends Route({
  path: "/settings",
  layout: ShellLayout,
  title: I18n.pages.settings.title,
  tab: { order: 3, icon: "settings" },
}) {
  override async loader(ctx: RouteContext<this>) {
    return { device: await ctx.prefs.read(DevicePrefs) };
  }

  override async submit(ctx: RouteContext<this>) {
    const parsed = validate(TenantSettings, await ctx.formData());
    if (!parsed.success) return ctx.fieldErrors(parsed.error);
    const result = await ctx.action(SetSettingValuesAction, { values: parsed.data });
    return result.ok ? { saved: true } : ctx.fieldErrors(result.error);
  }
}
```

The page beside it is `class Settings extends Component<RouteProps<typeof SettingsRoute>>`; it imports the route as a
type only. `ctx.params` and `ctx.search` are typed by the route's `params` and `search` shape classes or by its path,
and the data the route's layout resolved is spread into the context (`ctx.site` under `SiteLayout`). A loader returns
data, `ctx.redirect(Routes.x, params)`, `ctx.data(value, { status })`, or throws `ctx.notFound()`.

## Links and locale mounts

Every link names a `Routes.<key>` ref, a settings page or a resource, never a path: `<Link to={Routes.product}
params={{ slug }}>`. The href is built in the visitor's locale mount (`/ar-sa/store/tee`), lowercase prefixes, the
default locale unprefixed (ADR 0297), with the same rule `@stackra/seo` uses. Gen registers the route table with
`registerRoutes(routeTable)` so refs resolve to paths.

## Context members other packages own

`RouteServices` is open: identity adds `session` and `identity`, iam `actor`, state `prefs`, gen `env`, each by
declaration merging plus `contributeRouteContext(part)` for the value. `query` and `action` call the container's
`RouteCaller` driver (or the request's public clients on a Worker); `platform`, `captcha`, `settings` and `config` are
read from the container when first used.

## Resource routes and panel pages

`toResource(Resources.Order)` routes the pages panel's `resource()` declares, by panel's page names: `list` at the base,
`create` at `new`, `view` at `:id`, `edit` at `:id/edit`. The panel package registers the pages these routes and
`toPanel` render with `registerRoutePages` (panel's `registerPanelPages`), so navigation imports no panel code.

## Route overlay, router providers and the leave confirmation

Wave 6 of the design system (ADR 0317) adds the router bindings `@stackra/ui` stays free of: `RouteOverlay` and
`useRouteOverlay` open a route as a sheet or dialog over its parent (`OverlayPresentation`), `ReactRouterProvider`
(`./react`) and `ReactNavigationProvider` (`./native`) hand `@stackra/ui` the router's link seam, and
`RouteLeaveConfirmation` blocks leaving a dirty form. On native, `routeOverlayScreenOptions` gives the stack screen
its presentation. The contract types are in `./contracts`.

## Testing

```ts
import { renderRoute, runRouteLoader } from "@stackra/navigation/testing";
import { screen } from "@stackra/testing/react";

const { result, tenancy } = await runRouteLoader(TabsLayout, { session, services: [tenancyPart] });
renderRoute(Routes.dashboard, { providers: [I18nTestProvider], session });
expect(await screen.findByText("Today's revenue")).toBeTruthy();
```

- `runRouteLoader(Class, input)` and `runRouteSubmit(Route, { form, ... })` run one loader or submit and return
  `{ result, ...fakes }`; a redirect is `{ redirect, params }`. `url`, `path` and `search` shape the request,
  `container` builds the class and backs `ctx.config`, and any other member reaches the context as given.
- `routeMeta(Route, { data, container, site, path })` returns the meta descriptors the web adapter writes, through the
  same SEO chain (it needs a container with `SeoConfig`).
- `renderRoute(Routes.x | XRoute, options)` mounts the page gen's route table bound (or `component`) under a React Router
  stub at the route's path, through `@stackra/testing/react`'s `render` with the caller's `providers` and `wrapper`;
  the loader and submit run through the route context. `renderLayout(XLayout, { component })` does the same for a
  layout over an empty outlet. Loaders resolve after the first paint: read with `findBy`.
- Another package's fakes take part through a testing part: registered for the process with
  `registerRouteTestingPart`, or for one call in `services`. Navigation imports no tenancy, settings or identity code.
- Web only: the React Navigation `renderRoute` is not built.
