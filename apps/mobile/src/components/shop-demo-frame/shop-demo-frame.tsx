/**
 * Stackra file contract:
 * Purpose: `ShopDemoFrame`, what an app gives the native resource pages, for the resource page demos: a container
 *          whose `ClientTransport` answers the demo shop's refs from memory (four products, a search by name, create
 *          and restock), the server-state cache, the panel catalogue and the shop's resource labels in the active
 *          locale, and the confirmation dialogs.
 * Boundary: demo support, shared by the List, View, Form and action modal demos; no network. The shop's labels are
 *           built from the demo catalogue words, as gen builds a module's `resources` labels. The cache is the
 *           TanStack client alone (no realtime), as the panel's own tests stand it in.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0260 (decision 6); ADR 0307.
 */
import { ClientTransport } from "@stackra/clients/contracts";
import type { ClientRequest } from "@stackra/clients/contracts";
import { Container } from "@stackra/container";
import type { Token } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { mergeCatalogues } from "@stackra/i18n";
import { I18nProvider, useLocale } from "@stackra/i18n/react";
import panelAr from "@stackra/panel/assets/lang/ar/panel.json";
import panelEn from "@stackra/panel/assets/lang/en/panel.json";
import { ServerStateCache } from "@stackra/query";
import { ConfirmationProvider, useCatalogueText } from "@stackra/ui/native";
import { QueryClient } from "@tanstack/query-core";
import { useEffect, useState, type ReactNode } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { RESOURCE_PAGES_DEMO_KEYS } from "#src/demos/free/resource-list-page/resource-pages-demo-keys.constant";

/** The panel catalogue in Arabic, over the English one for any word not translated yet. */
const PANEL_ARABIC = mergeCatalogues([panelEn, panelAr]);

/** The shop words. */
const K = RESOURCE_PAGES_DEMO_KEYS.demo_free.resource_list_page.basics;

/** The action modal words. */
const M = RESOURCE_PAGES_DEMO_KEYS.demo_free.action_input_modal.basics;

/** The demo shop's products; restock and create change them while the app runs. */
const PRODUCTS = [
  { id: "prd_01j9z3k4m5n6p7q8r9s0t1v2wa", name: "Cardamom coffee", stock: 42, status: "active" },
  { id: "prd_01j9z3k4m5n6p7q8r9s0t1v2wb", name: "Saffron tea", stock: 8, status: "active" },
  { id: "prd_01j9z3k4m5n6p7q8r9s0t1v2wc", name: "Date cookies", stock: 0, status: "draft" },
  { id: "prd_01j9z3k4m5n6p7q8r9s0t1v2wd", name: "Rose water", stock: 15, status: "active" },
];

/** Answers the shop's refs from `PRODUCTS`. */
class ShopTransport extends ClientTransport {
  send(request: ClientRequest): Promise<unknown> {
    const input = request.input as Readonly<Record<string, unknown>>;
    const found = PRODUCTS.find((product) => product.id === input["productId"]);
    switch (request.key) {
      case "shop.product.list@1": {
        const search = typeof input["search"] === "string" ? input["search"].toLowerCase() : "";
        const items = PRODUCTS.filter((product) => product.name.toLowerCase().includes(search));
        return Promise.resolve({ items, hasMore: false });
      }
      case "shop.product.get@1": {
        return found === undefined
          ? Promise.reject(new Error(`no product ${String(input["productId"])}`))
          : Promise.resolve(found);
      }
      case "shop.product.create@1": {
        const id = `prd_01j9z3k4m5n6p7q8r9s0t1v2w${PRODUCTS.length}`;
        PRODUCTS.push({ ...(input as Omit<(typeof PRODUCTS)[number], "id">), id });
        return Promise.resolve({ id });
      }
      case "shop.product.restock@1": {
        if (found !== undefined) found.stock += Number(input["quantity"]);
        return Promise.resolve({ stock: found?.stock ?? 0 });
      }
      default: {
        return Promise.reject(new Error(`the demo shop does not answer ${request.key}`));
      }
    }
  }

  queue(): Promise<void> {
    return Promise.resolve();
  }
}

/** The demo's container, booted once: the shop transport and a cache over one TanStack client. */
const BOOT = Container.create([], {
  overrides: new Map<Token, object>([
    [ClientTransport, new ShopTransport()],
    [
      ServerStateCache,
      Object.assign(Object.create(ServerStateCache.prototype) as ServerStateCache, {
        client: new QueryClient(),
        watch: () => () => undefined,
      }),
    ],
  ]),
});

/** The resource pages' world for `children`: the shop's container, labels and confirmations. */
export function ShopDemoFrame({ children }: { readonly children: ReactNode }) {
  const t = useCatalogueText(MESSAGES.en);
  const { locale } = useLocale();
  const [container, setContainer] = useState<Container | undefined>(undefined);
  useEffect(() => void BOOT.then(setContainer), []);
  if (container === undefined) return null;
  const isArabic = locale.startsWith("ar");
  const labels = {
    id: t(K.id),
    name: t(K.name),
    stock: t(K.stock),
    status: t(K.status),
  };
  const shop = {
    resources: {
      product: {
        title: t(K.title),
        columns: labels,
        entries: labels,
        fields: { ...labels, quantity: t(M.quantity), note: t(M.note) },
        actions: { restock: t(M.restock) },
      },
    },
    enums: { product_status: { active: t(K.active), draft: t(K.draft) } },
  };
  return (
    <I18nProvider
      locale={locale}
      messages={{
        ...MESSAGES[isArabic ? "ar" : "en"],
        panel: isArabic ? PANEL_ARABIC : panelEn,
        shop,
      }}
    >
      <ContainerProvider container={container}>
        <ConfirmationProvider>{children}</ConfirmationProvider>
      </ContainerProvider>
    </I18nProvider>
  );
}
