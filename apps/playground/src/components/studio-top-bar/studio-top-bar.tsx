/**
 * Stackra file contract:
 * Purpose: the Theme Studio's top bar, calm and in three parts, mirrored in RTL:
 *          - Start: Exit, then the page's h1 ("Theme Studio") with the brand the theme starts from under it, quietly
 *            (the rail's Brand section picks the brand).
 *          - Centre: the device the canvas draws (desktop, iPad, iPhone, Android) and Landscape, which turns a tablet
 *            or phone on its side; the preview is the centre of attention, so its device is too.
 *          - End: undo and redo, the Display popover (mode, side by side, zoom, direction, reset, copy link: the
 *            shell's Display pattern), the inspector's toggle and Export.
 *          Every control is 36px high on the control radius, and the bar keeps one line down to about 1100px: the
 *          device names fold to their icons on a narrow bar, keeping their accessible names. The open Display
 *          popover follows its trigger when the bar changes width (the inspector opening, closing or resizing).
 * Boundary: presentation only; every value is the page's.
 * Runtime: browser
 * Governing contract: ADR 0320 (the Theme Studio); WCAG 2.2 SC 1.3.1, 2.4.6, 4.1.2.
 */
import {
  Button,
  Heading,
  Icon,
  IconButton,
  Popover,
  ToggleButton,
  ToggleButtonGroup,
  Toolbar,
  useCatalogueText,
} from "@stackra/ui/react";
import { useEffect, useRef, useState } from "react";

import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { THEME_STUDIO_KEYS } from "#src/routes/theme-studio/theme-studio-keys.constant";

import { StudioDisplaySettings } from "./studio-display-settings";
import type { StudioTopBarProps } from "./studio-top-bar.props";

/** The bar's keys. */
const K = THEME_STUDIO_KEYS.theme_studio.page;

const DEVICES = [
  { id: "desktop", icon: Icons.Monitor },
  { id: "tablet", icon: Icons.Tablet },
  { id: "iphone", icon: Icons.Smartphone },
  { id: "android", icon: Icons.Smartphone },
] as const;

/** One height for every control on the bar (the components draw the control radius). */
const CONTROL = "h-9 min-h-9";

/** The studio's top bar. */
export function StudioTopBar(props: StudioTopBarProps) {
  const t = useCatalogueText(MESSAGES.en);
  const { view, onViewChange } = props;
  const language = props.direction === "rtl" ? "ar" : "en";
  const bar = useRef<HTMLElement>(null);
  const [isDisplayOpen, setDisplayOpen] = useState(false);

  // React Aria places an open popover again only when the window resizes. The inspector opening, closing or being
  // dragged (side by side folds it too, from inside the popover) moves the trigger without one, so the bar's own
  // resize is passed on as the window's.
  useEffect(() => {
    const element = bar.current;
    if (!isDisplayOpen || !element || typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(() => window.dispatchEvent(new Event("resize")));
    observer.observe(element);
    return () => observer.disconnect();
  }, [isDisplayOpen]);

  return (
    <header
      ref={bar}
      className="@container grid grid-cols-[minmax(0,1fr)_auto_minmax(max-content,1fr)] items-center gap-3 border-b border-separator bg-background px-3 py-2"
    >
      <div className="flex min-w-0 items-center gap-2">
        <Button
          size="sm"
          variant="ghost"
          startIcon={<Icon name={Icons.ArrowLeft} isMirroredInRtl />}
          onPress={props.onExit}
          className={`${CONTROL} shrink-0`}
        >
          {t(K.exit)}
        </Button>
        <div className="grid min-w-0 leading-tight">
          <Heading level={1} className="truncate text-sm font-semibold">
            {t(K.title)}
          </Heading>
          <span className="truncate text-xs text-muted">
            <span className="sr-only">{`${t(K.theme)}: `}</span>
            {props.brand.name[language]}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <ToggleButtonGroup
          aria-label={t(K.device)}
          size="sm"
          selectionMode="single"
          disallowEmptySelection
          selectedKeys={[view.device]}
          onSelectionChange={(keys) => {
            const picked = DEVICES.find(({ id }) => keys.has(id));
            if (picked) onViewChange({ ...view, device: picked.id });
          }}
        >
          {DEVICES.map(({ id, icon }) => (
            <ToggleButton key={id} id={id} aria-label={t(K.devices[id])} className={CONTROL}>
              <Icon name={icon} size="sm" />
              <span aria-hidden="true" className="hidden @[64rem]:inline">
                {t(K.devices[id])}
              </span>
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <ToggleButton
          size="sm"
          aria-label={t(K.landscape)}
          isSelected={view.isLandscape && view.device !== "desktop"}
          isDisabled={view.device === "desktop"}
          onChange={(isLandscape) => onViewChange({ ...view, isLandscape })}
          className={CONTROL}
        >
          <Icon name={Icons.RotateCw} size="sm" />
        </ToggleButton>
      </div>
      <div className="flex min-w-0 items-center justify-end gap-2">
        <Toolbar aria-label={t(K.history)} className="flex items-center gap-1">
          <IconButton
            size="sm"
            variant="ghost"
            icon={<Icon name={Icons.Undo2} isMirroredInRtl />}
            label={t(K.undo)}
            isDisabled={!props.canUndo}
            onPress={props.onUndo}
            className={CONTROL}
          />
          <IconButton
            size="sm"
            variant="ghost"
            icon={<Icon name={Icons.Redo2} isMirroredInRtl />}
            label={t(K.redo)}
            isDisabled={!props.canRedo}
            onPress={props.onRedo}
            className={CONTROL}
          />
        </Toolbar>
        <Popover
          isOpen={isDisplayOpen}
          onOpenChange={setDisplayOpen}
          title={t(K.display)}
          placement="bottom"
          align="end"
          className="w-[25rem] max-w-[calc(100vw-2rem)] max-h-[calc(100dvh-5rem)] overflow-y-auto"
          trigger={
            <Button
              size="sm"
              variant="ghost"
              startIcon={Icons.Settings}
              aria-label={t(K.display)}
              className={`${CONTROL} @max-[52rem]:min-w-9 @max-[52rem]:px-2`}
            >
              <span className="@max-[52rem]:sr-only">{t(K.display)}</span>
            </Button>
          }
        >
          <div className="w-full pt-4">
            <StudioDisplaySettings {...props} />
          </div>
        </Popover>
        <IconButton
          size="sm"
          variant={props.isInspectorOpen ? "secondary" : "ghost"}
          icon={<Icon name={Icons.PanelRight} isMirroredInRtl />}
          label={props.isInspectorOpen ? t(K.hide_inspector) : t(K.show_inspector)}
          onPress={props.onInspectorToggle}
          className={CONTROL}
        />
        <Button size="sm" startIcon={Icons.Download} onPress={props.onExport} className={CONTROL}>
          {t(K.export)}
        </Button>
      </div>
    </header>
  );
}
