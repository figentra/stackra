/**
 * Stackra file contract:
 * Purpose: `StudioDisplaySettings`, the body of the Theme Studio top bar's Display popover, laid out as the shell's
 *          Display popover is (`DisplaySection`, `displayField`): each control stretched to the popover's width at one
 *          height, in two sections, then the theme's actions at the foot:
 *          - Preview: the canvas's mode (light, dark, or the page's), the layout (one scheme, or light and dark side
 *            by side) and the zoom (Fit, 50, 75, 100%).
 *          - Language: the reading direction (LTR English, RTL Arabic).
 *          - Foot (`DISPLAY_FOOTER`, as the shell's): reset the theme to the brand's, and copy a link to it.
 * Boundary: presentation only; every value is the page's.
 * Runtime: browser
 * Governing contract: ADR 0320 (the Theme Studio); ADR 0302 (decision 5); WCAG 2.2 SC 1.3.1, 4.1.2.
 */
import {
  Button,
  Icon,
  ToggleButton,
  ToggleButtonGroup,
  Toolbar,
  useCatalogueText,
} from "@stackra/ui/react";

import { DISPLAY_FOOTER, DisplaySection, displayField } from "#src/components/playground-shell";
import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { THEME_STUDIO_KEYS } from "#src/routes/theme-studio/theme-studio-keys.constant";

import type { StudioDisplaySettingsProps } from "./studio-display-settings.props";

/** The page's and the canvas's keys. */
const K = THEME_STUDIO_KEYS.theme_studio.page;
const C = THEME_STUDIO_KEYS.theme_studio.canvas;

const SCHEMES = [
  { id: "light", icon: Icons.Sun },
  { id: "dark", icon: Icons.Moon },
  { id: "system", icon: Icons.Monitor },
] as const;

const ZOOMS = ["fit", "50", "75", "100"] as const;

const LAYOUTS = [
  { id: "single", icon: Icons.Square },
  { id: "side_by_side", icon: Icons.Columns2 },
] as const;

/** A segment of a stretched segmented control: an equal share of its width, narrow enough for "Fit" in Arabic. */
const SEGMENT = "min-w-0 flex-1 px-1";

/** The studio's display settings. */
export function StudioDisplaySettings(props: StudioDisplaySettingsProps) {
  const t = useCatalogueText(MESSAGES.en);
  const { view, onViewChange } = props;
  const mode = props.schemeChoice ?? "system";
  const layout = view.isSideBySide ? "side_by_side" : "single";
  return (
    <Toolbar aria-label={t(K.display)} className="block w-full">
      <div className="grid gap-4">
        <DisplaySection title={t(K.sections.preview)}>
          {displayField(
            t(K.mode),
            <ToggleButtonGroup
              aria-label={t(K.mode)}
              fullWidth
              selectionMode="single"
              disallowEmptySelection
              selectedKeys={[mode]}
              onSelectionChange={(keys) => {
                const picked = SCHEMES.find(({ id }) => keys.has(id));
                if (picked) props.onSchemeChange(picked.id === "system" ? null : picked.id);
              }}
            >
              {SCHEMES.map(({ id, icon }) => (
                <ToggleButton key={id} id={id} aria-label={t(K.schemes[id])} className={SEGMENT}>
                  <Icon name={icon} size="sm" />
                </ToggleButton>
              ))}
            </ToggleButtonGroup>,
            t(K.schemes[mode]),
          )}
          {displayField(
            t(C.zoom),
            <ToggleButtonGroup
              aria-label={t(C.zoom)}
              fullWidth
              selectionMode="single"
              disallowEmptySelection
              selectedKeys={[view.zoom]}
              onSelectionChange={(keys) => {
                const picked = ZOOMS.find((key) => keys.has(key));
                if (picked) onViewChange({ ...view, zoom: picked });
              }}
            >
              {ZOOMS.map((key) => (
                <ToggleButton key={key} id={key} className={SEGMENT}>
                  {key === "fit" ? t(C.fit) : <bdi dir="ltr">{`${key}%`}</bdi>}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>,
          )}
          {displayField(
            t(K.layout),
            <ToggleButtonGroup
              aria-label={t(K.layout)}
              fullWidth
              selectionMode="single"
              disallowEmptySelection
              selectedKeys={[layout]}
              onSelectionChange={(keys) =>
                onViewChange({ ...view, isSideBySide: keys.has("side_by_side") })
              }
            >
              {LAYOUTS.map(({ id, icon }) => (
                <ToggleButton key={id} id={id} aria-label={t(K.layouts[id])} className={SEGMENT}>
                  <Icon name={icon} size="sm" />
                </ToggleButton>
              ))}
            </ToggleButtonGroup>,
            t(K.layouts[layout]),
          )}
        </DisplaySection>
        <DisplaySection title={t(K.sections.language)}>
          {displayField(
            t(K.direction),
            <ToggleButtonGroup
              aria-label={t(K.direction)}
              fullWidth
              selectionMode="single"
              disallowEmptySelection
              selectedKeys={[props.direction]}
              onSelectionChange={(keys) => props.onDirectionChange(keys.has("rtl") ? "rtl" : "ltr")}
            >
              {(["ltr", "rtl"] as const).map((direction) => (
                <ToggleButton
                  key={direction}
                  id={direction}
                  aria-label={t(K.directions[direction])}
                  className={SEGMENT}
                >
                  <bdi dir="ltr" className="text-xs font-semibold">
                    {direction.toUpperCase()}
                  </bdi>
                </ToggleButton>
              ))}
            </ToggleButtonGroup>,
          )}
        </DisplaySection>
        <div className={DISPLAY_FOOTER}>
          <Button variant="outline" size="sm" startIcon={Icons.RotateCcw} onPress={props.onReset}>
            {t(K.reset)}
          </Button>
          <Button variant="outline" size="sm" startIcon={Icons.Link2} onPress={props.onCopyLink}>
            {t(K.link)}
          </Button>
        </div>
      </div>
    </Toolbar>
  );
}
