/**
 * Stackra file contract:
 * Purpose: `IssuedWalletPass`, what issuing a pass gives back: the signed `.pkpass` file of Apple Wallet, or the
 *          object id and the "Add to Google Wallet" save link of Google Wallet.
 * Boundary: a type only. The `.pkpass` bytes go to the customer as a download or an attachment; the save link is
 *           safe to show (it names the object, it holds no content). Neither is stored here.
 * Runtime: isomorphic
 * Governing contract: ADR 0348 (decision 5).
 */

/** An issued pass. */
export type IssuedWalletPass =
  | {
      readonly provider: "apple_wallet";
      /** The pass's serial. */
      readonly serial: string;
      /** The signed bundle, `application/vnd.apple.pkpass`. */
      readonly file: {
        readonly name: string;
        readonly mediaType: "application/vnd.apple.pkpass";
        readonly bytes: Uint8Array;
      };
    }
  | {
      readonly provider: "google_wallet";
      /** The pass's serial. */
      readonly serial: string;
      /** The Google Wallet object id, `<issuerId>.<serial>`. */
      readonly objectId: string;
      /** `https://pay.google.com/gp/v/save/<jwt>`. */
      readonly saveUrl: string;
    };
