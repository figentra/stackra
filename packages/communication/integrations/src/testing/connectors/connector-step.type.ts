/**
 * Stackra file contract:
 * Purpose: `ConnectorStep<C>`, one call a recorded connector case makes on the driver: a method of connector contract
 *          `C`, its arguments, and either the result it must return or the refusal it must raise.
 * Boundary: a type only; `method` and `args` are checked against `C`, so a case of `SalesChannelConnector` cannot
 *           call a method the contract lacks. A step with neither `result` nor `refusal` only has to resolve.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); ADR 0443 (decision 8); owner D3 2026-10-27; STA-793.
 */

/** A promise-returning method of `C`, optional ones included. */
type Method<C, M extends keyof C> =
  NonNullable<C[M]> extends (...args: infer A) => Promise<infer R>
    ? {
        /** The method called. */
        readonly method: M;
        /** Its arguments. */
        readonly args: Readonly<A>;
        /** The result it must return, compared deeply. */
        readonly result?: R;
        /** The refusal it must raise instead (`ProviderRefusedError`), by status and optional code. */
        readonly refusal?: { readonly status: number; readonly code?: string };
      }
    : never;

/**
 * One step of a connector case.
 *
 * @example
 * const step: ConnectorStep<SalesChannelConnector> = { method: "acknowledge", args: ["ORD-1"] };
 */
export type ConnectorStep<C> = { [M in keyof C & string]-?: Method<C, M> }[keyof C & string];
