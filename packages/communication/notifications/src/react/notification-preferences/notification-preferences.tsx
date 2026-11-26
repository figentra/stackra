/**
 * Stackra file contract:
 * Purpose: `NotificationPreferences`, the notifications kit's web preferences editor: each topic as a setting row with
 *          one switch per offered channel (a topic offering none of them is left out), read and saved through the `NotificationPreferencesClient` port. A locked
 *          channel shows disabled, with the host's words for why.
 * Boundary: composition of @stackra/ui (Form, FormSection, SettingRow, Switch, Button, Alert, ErrorState, Spinner,
 *           Text) over the container's `NotificationPreferencesClient`. A save sends only the switches that changed,
 *           then reads the rows again; a failed read shows an ErrorState with a retry, a failed save a danger Alert
 *           (announced), a done save a status line. Each topic's switches are a group named by the topic; logical
 *           classes mirror it in right-to-left.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0260 (client ports); ADR 0165 (UI through @stackra/ui);
 *                     ADR 0223 (decision 5 as amended by ADR 0270); WCAG 2.2 SC 1.3.1, 3.3.1, 4.1.3.
 */
import { useContainer } from "@stackra/container/react";
import { Enum } from "@stackra/contracts";
import {
  Alert,
  Button,
  ErrorState,
  Form,
  FormSection,
  SettingRow,
  Spinner,
  Switch,
  Text,
} from "@stackra/ui/react";
import { type FormEvent, type ReactElement, useCallback, useEffect, useState } from "react";

import { NotificationChannel } from "#contracts/enums/notification-channel.enum";
import { NotificationPreferencesClient } from "#contracts/ports/notification-preferences-client.port";
import type { NotificationPreferenceRow } from "#contracts/types/notification-preference-row.type";
import type { NotificationPreferencesProps } from "#react/notification-preferences/notification-preferences.props";

/** The draft key of one topic's channel. */
const keyOf = (topic: string, channel: NotificationChannel) => `${topic} ${channel}`;

/**
 * The notification preferences editor.
 *
 * @example
 * <NotificationPreferences scope="user" labels={labels} />
 */
export function NotificationPreferences({
  channels = Enum.values(NotificationChannel),
  scope = "user",
  labels,
}: NotificationPreferencesProps): ReactElement {
  const port = useContainer().get(NotificationPreferencesClient);
  const [rows, setRows] = useState<readonly NotificationPreferenceRow[] | null>(null);
  const [draft, setDraft] = useState<ReadonlyMap<string, boolean>>(new Map());
  const [isLoadFailed, setLoadFailed] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [saved, setSaved] = useState<"idle" | "done" | "failed">("idle");

  // `isLive` is false once the editor is gone, so a late answer sets nothing.
  const read = useCallback(
    (isLive: () => boolean) =>
      port.get(scope).then(
        (answer) => {
          if (!isLive()) return;
          setRows(answer);
          setDraft(new Map());
        },
        () => {
          if (isLive()) setLoadFailed(true);
        },
      ),
    [port, scope],
  );
  useEffect(() => {
    let isLive = true;
    void read(() => isLive);
    return () => {
      isLive = false;
    };
  }, [read]);

  const changes = (rows ?? []).flatMap((row) =>
    channels.flatMap((channel) => {
      const isEnabled = draft.get(keyOf(row.topic, channel));
      const state = row.channels[channel];
      return state === undefined || isEnabled === undefined || isEnabled === state.isEnabled
        ? []
        : [{ topic: row.topic, channel, isEnabled }];
    }),
  );

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (changes.length === 0) return;
    setSaving(true);
    setSaved("idle");
    try {
      await port.set(scope, changes);
      await read(() => true);
      setSaved("done");
    } catch {
      setSaved("failed");
    } finally {
      setSaving(false);
    }
  };

  if (isLoadFailed)
    return (
      <ErrorState
        title={labels.loadFailed}
        retry={{
          label: labels.retry,
          onPress: () => {
            setLoadFailed(false);
            void read(() => true);
          },
        }}
      />
    );
  if (rows === null) return <Spinner label={labels.loading} />;
  const shown = rows.filter((row) => channels.some((channel) => row.channels[channel]));

  return (
    <Form onSubmit={(event) => void save(event)}>
      <FormSection title={labels.title} description={labels.description}>
        {shown.length === 0 ? (
          <Text tone="muted">{labels.empty}</Text>
        ) : (
          shown.map((row) => (
            <SettingRow
              key={row.topic}
              title={row.label}
              description={row.description}
              action={
                <div role="group" aria-label={row.label} className="flex flex-wrap gap-4">
                  {channels.map((channel) => {
                    const state = row.channels[channel];
                    if (state === undefined) return null;
                    const key = keyOf(row.topic, channel);
                    return (
                      <Switch
                        key={channel}
                        label={labels.channels[channel]}
                        value={draft.get(key) ?? state.isEnabled}
                        isDisabled={state.isLocked || isSaving}
                        {...(state.isLocked ? { description: labels.locked } : {})}
                        onChange={(isEnabled) => {
                          setSaved("idle");
                          setDraft((current) => new Map(current).set(key, isEnabled));
                        }}
                      />
                    );
                  })}
                </div>
              }
            />
          ))
        )}
      </FormSection>
      {saved === "failed" && <Alert tone="danger" title={labels.saveFailed} />}
      <div className="flex items-center gap-3">
        <Button type="submit" isLoading={isSaving} isDisabled={changes.length === 0}>
          {labels.save}
        </Button>
        <Text role="status" tone="success" type="small">
          {saved === "done" ? labels.saved : ""}
        </Text>
      </div>
    </Form>
  );
}
