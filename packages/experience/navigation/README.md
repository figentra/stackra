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
`./testing`) and React Navigation with React Native (`./native`) are optional peers.

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
| `./react`     | `toRoot`, `toLayout`, `toRoute`, `toPanel`, `toResource`, `toSettingsPage`, `registerRoutePages` | the data-route tree of a client-rendered app                                               |
| `./react`     | `routeAdapter`, `routeContext`                                                                   | framework-mode route modules on the Worker                                                 |
| `./native`    | `toScreen`, `useLayoutLoader`, `useNavigate`, `useRouteReload`, `ContextMenu`                    | the React Navigation tree, native navigation, pull to refresh, a value's context menu      |
| `./testing`   | `runLoader`, `registerRouteTestingPart`, `createRoutesStub`                                      | `const { result } = await runLoader(TabsLayout, { session })`                              |

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

## Testing

`runLoader(Class, input)` runs one loader with the registered testing parts' fakes and returns `{ result, ...fakes }`;
a redirect is `{ redirect, params }`. Another package's testing setup takes part with `registerRouteTestingPart`.
`createRoutesStub` is React Router's, for mounting a component under a stub route.
