/**
 * Stackra file contract:
 * Purpose: `PushPrimer`, the notifications kit's native push primer: a card that says what push notifications give
 *          before the system asks, with a button that asks and one that leaves it for later. As a sheet it fills the
 *          screen; inline it is a compact card inside onboarding.
 * Boundary: composition of @stackra/ui/native (Card, Button, Icon, Alert) over the container's `PushRegistration`. The
 *           ask goes through the port with the host's trigger and idempotency key; its answer, or `prompt` for "not
 *           now", goes to `onPermission`. A failed registration shows the host's words in a danger Alert (announced)
 *           and keeps the buttons. Logical classes mirror it in right-to-left.
 * Runtime: react-native
 * Governing contract: ADR 0504 (module UI kits); ADR 0260 (client ports); ADR 0302 (decision 3: native UI from
 *                     @stackra/ui); ADR 0223 (decision 1); ADR 0060 (right-to-left).
 */
import { useContainer } from "@stackra/container/react";
import { Alert, Button, Card, Icon } from "@stackra/ui/native";
import { type ReactElement, useState } from "react";

import { PushRegistration } from "#contracts/ports/push-registration.port";
import type { PushPrimerProps } from "#native/push-primer/push-primer.props";

/**
 * The push primer.
 *
 * @example
 * <PushPrimer trigger="onboarding" onPermission={next} labels={labels} />
 */
export function PushPrimer({
  variant = "sheet",
  trigger,
  idempotencyKey,
  onPermission,
  labels,
}: PushPrimerProps): ReactElement {
  const registration = useContainer().get(PushRegistration);
  const [isPending, setPending] = useState(false);
  const [isFailed, setFailed] = useState(false);
  const isSheet = variant === "sheet";
  const centred = isSheet ? { className: "text-center" } : {};

  const enable = async () => {
    setPending(true);
    setFailed(false);
    try {
      onPermission?.(
        await registration.register({
          trigger,
          ...(idempotencyKey === undefined ? {} : { idempotencyKey }),
        }),
      );
    } catch {
      setFailed(true);
    } finally {
      setPending(false);
    }
  };

  return (
    <Card className={isSheet ? "flex-1 justify-center gap-6 p-6" : "gap-3"}>
      <Card.Header className={isSheet ? "items-center gap-3" : "gap-1"}>
        <Icon name="info" size={isSheet ? "lg" : "md"} tone="accent" />
        <Card.Title {...centred}>{labels.title}</Card.Title>
        <Card.Description {...centred}>{labels.description}</Card.Description>
      </Card.Header>
      {isFailed ? <Alert tone="danger" title={labels.failed} /> : null}
      <Card.Footer className={isSheet ? "flex-col gap-2" : "flex-row gap-2"}>
        <Button isFullWidth={isSheet} isLoading={isPending} onPress={() => void enable()}>
          {labels.enable}
        </Button>
        <Button
          variant="ghost"
          isFullWidth={isSheet}
          isDisabled={isPending}
          onPress={() => onPermission?.("prompt")}
        >
          {labels.later}
        </Button>
      </Card.Footer>
    </Card>
  );
}
