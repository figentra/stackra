/**
 * Stackra file contract:
 * Purpose: the share inbox: what another app shared into this one (the `stackra://expo-sharing` link and every
 *          share that arrives while the app runs open it), one card per item, where a file is kept on the phone or
 *          uploaded, and Done forgets them all.
 * Boundary: presentation over @stackra/native-share: keeping writes through the container's `FileSystem` (the phone
 *           disk of @stackra/filesystem/native) under `sharedItemPath`; uploading goes through its `Uploader`
 *           (@stackra/media), whose upload endpoint checks the signed-in person's `media.upload.create`. A text or a
 *           link is shown only. Strings are `native_share::inbox.*`; item values are never logged.
 * Runtime: react-native
 * Governing contract: ADR 0478 (decision 5); ADR 0222 (decision 2); ADR 0465; ADR 0268 (R15); WCAG 2.2 SC 4.1.3.
 */
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useContainer } from "@stackra/container/react";
import { FileSystem } from "@stackra/filesystem/contracts";
import { useTranslation } from "@stackra/i18n/react";
import { Uploader } from "@stackra/media";
import { keepSharedItem, sharedItemPath, uploadSharedItem } from "@stackra/native-share";
import type { SharedItem } from "@stackra/native-share/contracts";
import { useIncomingShare } from "@stackra/native-share/react";
import { Button, Card } from "heroui-native";
import { useLayoutEffect, useState } from "react";
import { View } from "react-native";

import { Screen } from "../components/ui/screen";
import { SHARE_INBOX_KEYS } from "../constants/share-inbox-keys.constant";
import type { RootStackParamList } from "../navigation/root-stack-param-list.type";

const KEYS = SHARE_INBOX_KEYS.native_share.inbox;

/** Where one item stands: being handled, kept, uploaded, or failed. */
type ItemStatus = "busy" | "kept" | "uploaded" | "failed";

/** The share inbox screen. */
export function ShareInboxScreen({
  navigation,
}: NativeStackScreenProps<RootStackParamList, "ShareInbox">) {
  const { t } = useTranslation();
  const container = useContainer();
  const { items, share, clear } = useIncomingShare();
  const [statuses, setStatuses] = useState<Readonly<Record<string, ItemStatus>>>({});

  useLayoutEffect(() => navigation.setOptions({ title: t(KEYS.title) }), [navigation, t]);

  /** Runs `act` for `item`, recording whether it kept or uploaded the file (an item is its URI). */
  const handle = async (item: SharedItem, act: () => Promise<boolean>, done: ItemStatus) => {
    setStatuses((now) => ({ ...now, [item.value]: "busy" }));
    const isDone = await act().catch(() => false);
    setStatuses((now) => ({ ...now, [item.value]: isDone ? done : "failed" }));
  };

  const keep = (item: SharedItem) =>
    handle(
      item,
      () => keepSharedItem(share, item, container.get(FileSystem), sharedItemPath(item)),
      "kept",
    );

  // shortcut: the token is not claimed yet; once the app signs people in, an action (a receipt, a document) takes it.
  const upload = (item: SharedItem) =>
    handle(
      item,
      async () => (await uploadSharedItem(share, item, container.get(Uploader), null)) !== null,
      "uploaded",
    );

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
    status === "kept"
      ? t(KEYS.kept)
      : status === "uploaded"
        ? t(KEYS.uploaded)
        : status === "failed"
          ? t(KEYS.failed)
          : null;

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
          const isLocked = status === "busy" || status === "kept" || status === "uploaded";
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
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <Button
                      size="sm"
                      variant="secondary"
                      isDisabled={isLocked}
                      onPress={() => void keep(item)}
                    >
                      {t(KEYS.keep)}
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      isDisabled={isLocked}
                      onPress={() => void upload(item)}
                    >
                      {t(KEYS.upload)}
                    </Button>
                  </View>
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
