/**
 * Stackra file contract:
 * Purpose: the Theme Studio's "Settings form" template: a workspace settings page with a profile section (fields, a
 *          select, a text area), notification switches and a checkbox, a danger zone and the form's actions.
 * Boundary: a canvas template with no props; the theme is the canvas's. Nothing is saved.
 * Runtime: browser
 * Governing contract: ADR 0320 (the Theme Studio).
 */
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Heading,
  RadioGroup,
  Select,
  Separator,
  Switch,
  Text,
  TextArea,
  TextField,
  useCatalogueText,
} from "@stackra/ui/react";

import { MESSAGES } from "#src/constants/messages.constant";
import { THEME_STUDIO_KEYS } from "#src/routes/theme-studio/theme-studio-keys.constant";

import { STUDIO_DISPLAY } from "./studio-display.constant";

/** The template's keys. */
const K = THEME_STUDIO_KEYS.theme_studio.form;

/** The settings form template. */
export function StudioSettingsForm() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="mx-auto grid w-full max-w-3xl gap-6">
      <header className="grid gap-1">
        <Heading level={2} className={`[font:var(--h2)] ${STUDIO_DISPLAY}`}>
          {t(K.title)}
        </Heading>
        <Text tone="muted">
          <bdi>{t(K.subtitle)}</bdi>
        </Text>
      </header>
      <Card>
        <Card.Header>
          <Card.Title className={STUDIO_DISPLAY}>{t(K.profile)}</Card.Title>
          <Card.Description>
            <bdi>{t(K.profile_note)}</bdi>
          </Card.Description>
        </Card.Header>
        <Card.Content className="grid gap-4 @xl:grid-cols-2">
          <TextField label={t(K.name)} defaultValue={t(K.name_value)} />
          <TextField label={t(K.email)} type="email" defaultValue={t(K.email_value)} />
          <Select
            label={t(K.role)}
            items={(["admin", "editor", "viewer"] as const).map((id) => ({
              id,
              label: t(K.roles[id]),
            }))}
            defaultValue="editor"
          />
          <RadioGroup
            label={t(K.language)}
            orientation="horizontal"
            options={(["en", "ar"] as const).map((value) => ({
              value,
              label: t(K.languages[value]),
            }))}
            defaultValue="en"
          />
          <TextArea
            label={t(K.bio)}
            defaultValue={t(K.bio_value)}
            rows={3}
            className="@xl:col-span-2"
          />
        </Card.Content>
      </Card>
      <Card>
        <Card.Header>
          <Card.Title className={STUDIO_DISPLAY}>{t(K.notifications)}</Card.Title>
        </Card.Header>
        <Card.Content className="grid gap-4">
          <Switch label={t(K.email_updates)} defaultValue />
          <Separator />
          <Switch label={t(K.push)} />
          <Separator />
          <Checkbox label={t(K.digest)} defaultValue />
        </Card.Content>
      </Card>
      <Alert
        tone="danger"
        title={t(K.danger)}
        description={<bdi>{t(K.danger_note)}</bdi>}
        actions={
          <Button size="sm" variant="danger">
            {t(K.delete)}
          </Button>
        }
      />
      <footer className="flex justify-end gap-2">
        <Button variant="secondary">{t(K.cancel)}</Button>
        <Button>{t(K.save)}</Button>
      </footer>
    </div>
  );
}
