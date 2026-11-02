/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the native TenantMenu block (@stackra/tenancy): three organisations with the person's
 *          role in each; pressing one switches to it.
 * Boundary: a demo with no props: the kit block and a container of its own that binds a `TenantSwitcher` holding demo
 *           memberships, as an app's session would; every word from the catalogue. The same file is the preview and
 *           the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); ADR 0504 (module UI kits).
 */
import { Container } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { ActiveScopeService } from "@stackra/scope";
import { TenantSwitcher } from "@stackra/tenancy";
import { TenantMenu } from "@stackra/tenancy/native";
import { useCatalogueText } from "@stackra/ui/native";
import { useEffect, useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { MENU_DEMO_KEYS } from "#src/demos/free/tenant-menu/menu-demo-keys.constant";

/** The demo's keys. */
const K = MENU_DEMO_KEYS.demo_free.tenant_menu.basics;

/** The switcher an app's session would fill, holding the demo's memberships. */
const switcher = new TenantSwitcher(new ActiveScopeService());
switcher.setMemberships([
  {
    tenantId: "scp_01j9z3k4m5n6p7q8r9s0t1v2wa",
    path: "acme.retail",
    name: "Acme Retail",
    role: "owner",
    roles: ["owner"],
  },
  {
    tenantId: "scp_01j9z3k4m5n6p7q8r9s0t1v2wb",
    path: "acme.cafe",
    name: "Acme Café",
    role: "manager",
    roles: ["manager"],
  },
  {
    tenantId: "scp_01j9z3k4m5n6p7q8r9s0t1v2wc",
    path: "northwind",
    name: "Northwind Studio",
    role: "staff",
    roles: ["staff"],
  },
]);

/** The demo's container, booted once. */
const BOOT = Container.create([], { overrides: new Map([[TenantSwitcher, switcher]]) });

/** Tenant menu: switch between three organisations. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const [container, setContainer] = useState<Container | undefined>(undefined);
  useEffect(() => void BOOT.then(setContainer), []);
  if (container === undefined) return null;
  const roles: Readonly<Record<string, string>> = {
    owner: t(K.owner),
    manager: t(K.manager),
    staff: t(K.staff),
  };
  return (
    <ContainerProvider container={container}>
      <View>
        <TenantMenu
          describe={(membership) => roles[membership.role] ?? membership.role}
          labels={{ label: t(K.label), switching: t(K.switching), failed: t(K.failed) }}
        />
      </View>
    </ContainerProvider>
  );
}
