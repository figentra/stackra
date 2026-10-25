/**
 * Stackra file contract:
 * Purpose: `PanelRoutePage`, the page navigation renders for a panel route (`toPanel(AdminPanel)`): the panel's shell,
 *          framing the panel the class declares.
 * Boundary: internal to the `./react` entry; registered by `registerPanelPages`. Reads the class's recorded `path` and
 *           `area` through `kindOf`. The generic resource, document and settings pages the shell would frame are not
 *           built yet, so the shell frames nothing below it.
 * Runtime: browser
 * Governing contract: ADR 0307 (panel v3.1); ADR 0164 (decision 3: several panels).
 */
import type { AnyClass } from "@stackra/container";
import { kindOf } from "@stackra/container";
import type { ApiArea } from "@stackra/contracts";
import type { ReactElement } from "react";

import { snakeCase } from "#core/functions/snake-case.function";
import { PanelShell } from "#react/panel-shell/panel-shell";

/**
 * The shell of the panel class `panel`.
 *
 * @throws TypeError when `panel` is not a `Panel({ path, area })` class.
 * @example
 * registerRoutePages({ panel: PanelRoutePage });
 */
export function PanelRoutePage({ panel }: { readonly panel: AnyClass }): ReactElement {
  const record = kindOf(panel);
  if (record?.kind !== "panel")
    throw new TypeError(`${panel.name} does not extend Panel({ path, area })`);
  // shortcut: the key comes from the class name (`AdminPanel` is `admin`), not from the file as gen derives it; read
  // gen's panel table instead when it is registered (STA-339).
  const key = snakeCase(panel.name.replace(/Panel$/, ""));
  const ref = {
    key,
    path: record.options["path"] as string,
    area: record.options["area"] as ApiArea,
  };
  // shortcut: the shell frames nothing until the generic List, View, Create and Edit pages (and the document and
  // settings pages) exist; they become this route's children then (panel spec, open items).
  return <PanelShell panel={ref}>{null}</PanelShell>;
}
