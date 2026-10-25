/**
 * Stackra file contract:
 * Purpose: the native `BlockProps<typeof XBlock>`: the block's props as the visitor sees them (the `.` entry's
 *          `BlockProps`) plus `onEvent`, the sink a native block hands its verbs to, because a block never navigates or
 *          calls a service by itself on a phone.
 * Boundary: a type only, and a declaration of its own: `onEvent` is required here and absent from the `.` entry's
 *           type, so a web block navigates through the router while a native block raises a verb (registry A3).
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 12 and 37); ADR 0110 (decision 3); ADR 0294 (decision 15).
 */
import type { BlockEvent } from "#contracts/types/block-event.type";
import type { BlockClass } from "#core/types/block-class.type";
import type { BlockProps as CoreBlockProps } from "#core/types/block-props.type";

/**
 * The props of the native component that renders the block `B`.
 *
 * @example
 * export class PromoBanner extends Component<BlockProps<typeof PromoBannerBlock>> {
 *   render() {
 *     const { cta, onEvent } = this.props;
 *     return cta ? <Button onPress={() => onEvent(cta.event)}>{cta.label}</Button> : null;
 *   }
 * }
 */
export type BlockProps<B extends BlockClass> = CoreBlockProps<B> & {
  /** Hands a verb to the renderer, which passes it to the screen's handlers. */
  readonly onEvent: (event: BlockEvent) => void;
};
