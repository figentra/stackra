/**
 * Stackra file contract:
 * Purpose: the Theme Studio's "Component sheet" template: every key @stackra/ui component in its states (button
 *          variants, sizes, disabled and loading; icon buttons; chips, status badges and badges; fields at rest,
 *          filled, invalid and disabled; checkboxes, switches, radios and a select; tabs; alerts of each tone;
 *          progress, a spinner, skeletons and avatars), then the index page's scenes.
 * Boundary: a canvas template with no props; the theme is the canvas's.
 * Runtime: browser
 * Governing contract: ADR 0320 (the Theme Studio).
 */
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Checkbox,
  Chip,
  Heading,
  IconButton,
  ProgressBar,
  RadioGroup,
  Select,
  Skeleton,
  Spinner,
  StatusBadge,
  Switch,
  Tabs,
  Text,
  TextField,
  useCatalogueText,
} from "@stackra/ui/react";
import type { ReactNode } from "react";

import { Showcase } from "#src/components/showcase";
import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { THEME_STUDIO_KEYS } from "#src/routes/theme-studio/theme-studio-keys.constant";

import { STUDIO_DISPLAY } from "./studio-display.constant";

/** The template's keys. */
const K = THEME_STUDIO_KEYS.theme_studio.sheet;

/** The sample people's names. */
const P = THEME_STUDIO_KEYS.theme_studio.dashboard.people;

const VARIANTS = ["primary", "secondary", "tertiary", "outline", "ghost", "danger"] as const;
const SIZES = ["sm", "md", "lg"] as const;
const STATUSES = [
  ["success", "live"],
  ["warning", "building"],
  ["danger", "failed"],
  ["accent", "draft"],
] as const;
const ALERTS = ["accent", "success", "warning", "danger"] as const;

/** One titled group of the sheet. */
const group = (title: string, children: ReactNode) => (
  <section className="grid gap-3 border-b border-separator pb-6">
    <Heading level={2} className={`[font:var(--h4)] ${STUDIO_DISPLAY}`}>
      {title}
    </Heading>
    {children}
  </section>
);

/** The component sheet template. */
export function StudioComponentSheet() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="grid gap-6">
      {group(
        t(K.buttons),
        <div className="grid gap-3">
          <div className="flex flex-wrap gap-2">
            {VARIANTS.map((variant) => (
              <Button key={variant} variant={variant}>
                {t(K.variants[variant])}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {SIZES.map((size) => (
              <Button key={size} size={size} variant="secondary">
                {t(K.sizes[size])}
              </Button>
            ))}
            <Button isDisabled>{t(K.disabled)}</Button>
            <Button isLoading>{t(K.loading)}</Button>
            <IconButton icon={Icons.Plus} label={t(K.icon_add)} />
            <IconButton icon={Icons.Settings} label={t(K.icon_settings)} variant="secondary" />
            <IconButton icon={Icons.Settings} label={t(K.icon_settings)} variant="ghost" />
          </div>
        </div>,
      )}
      {group(
        t(K.chips),
        <div className="flex flex-wrap items-center gap-2">
          {STATUSES.map(([tone, id]) => (
            <StatusBadge key={tone} tone={tone}>
              {t(K.statuses[id])}
            </StatusBadge>
          ))}
          {STATUSES.map(([tone, id]) => (
            <Chip key={tone} variant="soft" tone={tone} size="sm">
              {t(K.statuses[id])}
            </Chip>
          ))}
          <Badge.Anchor>
            <Avatar name={t(P.layla)} size="sm" />
            <Badge tone="accent" size="sm" label={t(K.statuses.draft)}>
              {4}
            </Badge>
          </Badge.Anchor>
        </div>,
      )}
      {group(
        t(K.fields),
        <div className="grid gap-4 @2xl:grid-cols-2">
          <TextField label={t(K.field)} defaultValue={t(K.field_value)} />
          <TextField label={t(K.field_empty)} placeholder={t(K.field_placeholder)} />
          <TextField
            label={t(K.field_invalid)}
            defaultValue={t(K.field_invalid_value)}
            isInvalid
            errorMessage={t(K.field_error)}
          />
          <TextField
            label={t(K.field_disabled)}
            defaultValue={t(K.field_disabled_value)}
            isDisabled
          />
        </div>,
      )}
      {group(
        t(K.choices),
        <div className="grid gap-6 @2xl:grid-cols-3">
          <div className="grid content-start gap-3">
            <Checkbox label={t(K.checked)} defaultValue />
            <Checkbox label={t(K.unchecked)} />
            <Checkbox label={t(K.indeterminate)} isIndeterminate />
            <Checkbox label={t(K.disabled)} isDisabled />
          </div>
          <div className="grid content-start gap-3">
            <Switch label={t(K.switch_on)} defaultValue />
            <Switch label={t(K.switch_off)} />
            <Switch label={t(K.disabled)} isDisabled />
          </div>
          <div className="grid content-start gap-4">
            <RadioGroup
              label={t(K.plan)}
              options={(["free", "team", "business"] as const).map((value) => ({
                value,
                label: t(K.plans[value]),
              }))}
              defaultValue="team"
            />
            <Select
              label={t(K.plan)}
              items={(["free", "team", "business"] as const).map((id) => ({
                id,
                label: t(K.plans[id]),
              }))}
              defaultValue="business"
            />
          </div>
        </div>,
      )}
      {group(
        t(K.tabs_label),
        <Tabs
          label={t(K.tabs_label)}
          items={(["overview", "activity", "settings"] as const).map((id) => ({
            id,
            label: t(K.tabs[id]),
            content: (
              <Text tone="muted" className="pt-3">
                {t(K.tab_body, { name: t(K.tabs[id]) })}
              </Text>
            ),
          }))}
        />,
      )}
      {group(
        t(K.feedback),
        <div className="grid gap-4">
          <div className="grid gap-3 @2xl:grid-cols-2">
            {ALERTS.map((tone) => (
              <Alert
                key={tone}
                tone={tone}
                title={t(K.alerts[tone])}
                description={<bdi>{t(K.alert_note)}</bdi>}
              />
            ))}
          </div>
          <div className="grid items-center gap-4 @2xl:grid-cols-[1fr_auto]">
            <ProgressBar label={t(K.progress)} value={64} isLabelVisible isValueVisible />
            <Spinner label={t(K.spinner)} />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="size-10" style={{ borderRadius: "var(--radius-full)" }} />
            <div className="grid flex-1 gap-2">
              <Skeleton className="h-3 w-3/5" />
              <Skeleton className="h-3 w-2/5" />
            </div>
          </div>
        </div>,
      )}
      {group(
        t(K.people),
        <div className="flex flex-wrap items-center gap-3">
          {SIZES.map((size) => (
            <Avatar key={size} name={t(P.omar)} size={size} />
          ))}
          <Avatar name={t(P.sara)} tone="accent" />
          <Avatar name={t(K.field_value)} shape="square" tone="success" />
        </div>,
      )}
      <section className="grid gap-3">
        <Heading level={2} className={`[font:var(--h4)] ${STUDIO_DISPLAY}`}>
          {t(K.scenes)}
        </Heading>
        <Showcase headingLevel={3} />
      </section>
    </div>
  );
}
