/**
 * Stackra file contract:
 * Purpose: `ExtensionTable`, the shape of the printed chain gen writes to `#stackra/extensions`: every slot of every
 *          point a member hosts, keyed `<module>.<slot>`, with its kind, owner, declaring file, call sites and ordered
 *          extensions.
 * Boundary: a type only; the table is data for reviewers and agents (who changes the order total?). The runtime finds
 *           extensions through `registerExtensions`, never through this table. Files are named, never lines.
 * Runtime: isomorphic
 * Governing contract: ADR 0265 (decision 7: the chain is printed); ADR 0305 (rules 22 to 25).
 */

/** Every slot of a member, keyed `<module>.<slot>` (`orders.adjustTotals`). */
export type ExtensionTable = Readonly<
  Record<
    string,
    {
      /** `after` (a value pipeline) or `before` (a check ahead of the owner's step). */
      readonly kind: "after" | "before";
      /** The module key of the point's owner. */
      readonly owner: string;
      /** The point's class name. */
      readonly point: string;
      /** The file that declares the point, for a point of this member. */
      readonly declaredIn?: string;
      /** The call sites, `<file> (<Class>.<method>)`, for a point of this member. */
      readonly calledFrom?: readonly string[];
      /** The package a hosted point comes from. */
      readonly from?: string;
      /** The extensions, in ascending `order`. */
      readonly extensions: readonly {
        /** Its place in the chain. */
        readonly order: number;
        /** The module key of the extender. */
        readonly module: string;
        /** The extension's class name. */
        readonly class: string;
        /** Its file, for an extension of this member. */
        readonly file?: string;
        /** Its method, always `handle`. */
        readonly method?: string;
        /** The input namespace it adds to the owning action. */
        readonly input?: string;
        /** The package a hosted extension comes from. */
        readonly from?: string;
      }[];
    }
  >
>;
