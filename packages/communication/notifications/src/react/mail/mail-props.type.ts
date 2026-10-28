/**
 * Stackra file contract:
 * Purpose: `MailProps<typeof XNotification>`, the props of a `.mail.tsx` body: the notification's data, what its
 *          `data(event)` resolves to, or its trigger event when it has no `data` method.
 * Boundary: type only, read from the notification class, so no Props file is written for a mail body (ADR 0305 rule
 *           12 is met by the notification's Data schema).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 2 and 13); ADR 0305 (rules 12 and 37); ADR 0223.
 */
import type { AnyClass } from "@stackra/container";

import type { Notification } from "#core/index";

/**
 * The props of the mail body of notification `N`.
 *
 * @example
 * export class OrderPlacedMail extends Component<MailProps<typeof OrderPlacedNotification>> {
 *   render() {
 *     return <Button href={this.props.url}>{this.mail.t(I18n.orders.order_placed.mail.cta)}</Button>;
 *   }
 * }
 */
export type MailProps<N extends AnyClass<Notification>> =
  InstanceType<N> extends { data: (event: never) => infer D }
    ? Readonly<Awaited<D>>
    : Readonly<Parameters<InstanceType<N>["recipients"]>[0]>;
