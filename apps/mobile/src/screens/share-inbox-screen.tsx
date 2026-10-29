/**
 * Stackra file contract:
 * Purpose: the share inbox: what another app shared into this one (the `stackra://expo-sharing` link and every
 *          share that arrives while the app runs open it), one card per item, where a file is kept on the phone, and
 *          Done forgets them all.
 * Boundary: presentation over @stackra/native-share: keeping writes through the container's `FileSystem` (the phone
 *           disk of @stackra/filesystem/native) under `sharedItemPath`. There is no Upload action yet: the container
 *           binds the in-memory `Uploader`, which sends nothing off the phone; it comes back with `HttpUploaderDriver`
 *           (checked against `media.upload.create`) once the app signs people in. A text or a link is shown only.
 *           Strings are `native_share::inbox.*`; item values are never logged.
 * Runtime: react-native
 * Governing contract: ADR 0478 (decision 5); ADR 0222 (decision 2); ADR 0465; ADR 0268 (R15); WCAG 2.2 SC 4.1.3.
 */
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useContainer } from "@stackra/container/react";
import { FileSystem } from "@stackra/filesystem/contracts";
import { useTranslation } from "@stackra/i18n/react";
import { keepSharedItem, sharedItemPath } from "@stackra/native-share";
import type { SharedItem } from "@stackra/native-share/contracts";
import { useIncomingShare } from "@stackra/native-share/react";
import { Button, Card } from "heroui-native";
import { useLayoutEffect, useState } from "react";

import { Screen } from "../components/ui/screen";
import { SHARE_INBOX_KEYS } from "../constants/share-inbox-keys.constant";
import type { RootStackParamList } from "../navigation/root-stack-param-list.type";

const KEYS = SHARE_INBOX_KEYS.native_share.inbox;

/** Where one item stands: being kept, kept, or failed. */
type ItemStatus = "busy" | "kept" | "failed";

/** The share inbox screen. */
export function ShareInboxScreen({
  navigation,
}: NativeStackScreenProps<RootStackParamList, "ShareInbox">) {
  const { t } = useTranslation();
  const container = useContainer();
  const { items, share, clear } = useIncomingShare();
  const [statuses, setStatuses] = useState<Readonly<Record<string, ItemStatus>>>({});

  useLayoutEffect(() => navigation.setOptions({ title: t(KEYS.title) }), [navigation, t]);

  /** Keeps `item` on the phone, recording whether it was kept (an item is its URI). */
  const keep = async (item: SharedItem) => {
    setStatuses((now) => ({ ...now, [item.value]: "busy" }));
    const isKept = await keepSharedItem(
      share,
      item,
      container.get(FileSystem),
      sharedItemPath(item),
    ).catch(() => false);
    setStatuses((now) => ({ ...now, [item.value]: isKept ? "kept" : "failed" }));
  };

  const finish = async () => {
    await clear();
    setStatuses({});
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.replace("Tabs", { screen: "HomeTab" });
  };

  const label = (item: SharedItem) =>
    item.kind === "file"
      ? (item.name ?? t(KEYS.file))
      : t(item.kind === "url" ? KEYS.link : KEYS.text);

  const outcome = (status: ItemStatus | undefined) =>
    status === "kept" ? t(KEYS.kept) : status === "failed" ? t(KEYS.failed) : null;

  return (
    <Screen>
      {items.length === 0 ? (
        <Card>
          <Card.Body>
            <Card.Description>{t(KEYS.empty)}</Card.Description>
          </Card.Body>
        </Card>
      ) : (
        items.map((item) => {
          const status = statuses[item.value];
          const message = outcome(status);
          const isLocked = status === "busy" || status === "kept";
          return (
            <Card key={item.value}>
              <Card.Body>
                <Card.Title>{label(item)}</Card.Title>
                <Card.Description numberOfLines={3}>
                  {item.kind === "file" ? item.mimeType : item.value}
                </Card.Description>
                {message === null ? null : (
                  <Card.Description accessibilityLiveRegion="polite">{message}</Card.Description>
                )}
              </Card.Body>
              {item.kind === "file" ? (
                <Card.Footer>
                  <Button
                    size="sm"
                    variant="secondary"
                    isDisabled={isLocked}
                    onPress={() => void keep(item)}
                  >
                    {t(KEYS.keep)}
                  </Button>
                </Card.Footer>
              ) : null}
            </Card>
          );
        })
      )}
      <Button variant="secondary" onPress={() => void finish()}>
        {t(KEYS.done)}
      </Button>
    </Screen>
  );
}
