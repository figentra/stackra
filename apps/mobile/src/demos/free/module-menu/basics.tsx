/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the native ModuleMenu block (@stackra/navigation): two modules' declared navigation
 *          menus, a shop's places and a reports group, listed in registry order with no `items` passed.
 * Boundary: a demo with no props: it declares two menus and their routes once, as gen's route table does for an app,
 *           and reads them through the app's container and catalogue; the menus' labels are the demo's catalogue keys.
 *           A `RouterProvider` with a handler that does nothing keeps a press on the demo screen: the demo shows the
 *           list, not the screens. The same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); ADR 0504 (module UI kits); ADR 0111 (decisions 1 and 3).
 */
import {
  Menu,
  MenuKind,
  Route,
  registerMenus,
  registerRoutes,
  routeRef,
  type MenuBuilder,
} from "@stackra/navigation";
import { ModuleMenu } from "@stackra/navigation/native";
import { RouterProvider, useCatalogueText } from "@stackra/ui/native";

import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { MODULE_MENU_DEMO_KEYS } from "#src/demos/free/module-menu/module-menu-demo-keys.constant";

/** The demo's keys. */
const K = MODULE_MENU_DEMO_KEYS.demo_free.module_menu.basics;

class HomeRoute extends Route({ path: "/" }) {}
class OrdersRoute extends Route({ path: "/orders" }) {}
class CustomersRoute extends Route({ path: "/customers" }) {}
class SalesRoute extends Route({ path: "/reports/sales" }) {}
class StockRoute extends Route({ path: "/reports/stock" }) {}

/** The demo's route refs. */
const Routes = {
  home: routeRef("module_menu_demo_home"),
  orders: routeRef("module_menu_demo_orders"),
  customers: routeRef("module_menu_demo_customers"),
  sales: routeRef("module_menu_demo_sales"),
  stock: routeRef("module_menu_demo_stock"),
};

/** The shop module's menu. */
class ShopMenu extends Menu({ kind: MenuKind.Navigation }) {
  items(m: MenuBuilder) {
    return [
      m.route(Routes.home, { label: K.home, icon: Icons.House, end: true }),
      m.route(Routes.orders, { label: K.orders, icon: Icons.ShoppingBag }),
      m.route(Routes.customers, { label: K.customers, icon: Icons.User }),
    ];
  }
}

/** The reports module's menu: one group. */
class ReportsMenu extends Menu({ kind: MenuKind.Navigation }) {
  items(m: MenuBuilder) {
    return [
      m.group(K.reports, [
        m.route(Routes.sales, { label: K.sales, icon: Icons.ChartColumn }),
        m.route(Routes.stock, { label: K.stock, icon: Icons.Archive }),
      ]),
    ];
  }
}

registerRoutes({
  module_menu_demo_home: HomeRoute,
  module_menu_demo_orders: OrdersRoute,
  module_menu_demo_customers: CustomersRoute,
  module_menu_demo_sales: SalesRoute,
  module_menu_demo_stock: StockRoute,
});
registerMenus({ module_menu_demo_shop: ShopMenu, module_menu_demo_reports: ReportsMenu });

/** The places do nothing when pressed: the demo shows the list, not the screens. */
const stay = (): undefined => undefined;

/** Module menu: every declared navigation menu, read from the registry. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <RouterProvider navigate={stay}>
      <ModuleMenu label={t(K.label)} />
    </RouterProvider>
  );
}
