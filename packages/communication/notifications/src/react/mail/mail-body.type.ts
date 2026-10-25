/**
 * Stackra file contract:
 * Purpose: `MailBody<P>`, a mail body as the renderer takes it: the function component gen compiles a `.mail.tsx`
 *          class into, or that class as TypeScript sees it in source.
 * Boundary: type only. At run time the value is always a function component (gen compiles every
 *           `extends Component` class before the renderer sees it, ADR 0305 rule 37); the class arm only lets source
 *           code pass `OrderReceiptMail` with its props checked.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 37 to 41: class components); ADR 0223.
 */
import type { AnyClass } from "@stackra/container";
import type { ComponentType } from "react";

/** A mail body with props `P`. */
export type MailBody<P extends object> =
  | ComponentType<P>
  | AnyClass<{ readonly props: Readonly<P> }>;
