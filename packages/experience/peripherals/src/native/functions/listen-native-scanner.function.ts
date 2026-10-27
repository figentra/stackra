/**
 * Stackra file contract:
 * Purpose: `listenNativeScanner`, which subscribes a listener to the codes a POS terminal family's built-in scanner
 *          decodes (the module's `onScan` event).
 * Boundary: internal; not exported from the entry. A code is handed on only when it is a non-empty string; anything
 *           else from the event is dropped. Where the module is absent the subscription does nothing (the driver's
 *           probe refuses with capability `scanner`). Codes are never stored here.
 * Runtime: isomorphic
 * Governing contract: ADR 0442 (decision 4); ADR 0458, ADR 0459, ADR 0460; ADR 0253 (decision 4).
 */
import { nativeDevice } from "#native/functions/native-device.function";
import type { PosDeviceFamily } from "#native/types/pos-device-family.type";

/**
 * Calls `listener` with each code the family's scanner decodes; the returned function stops it.
 *
 * @example
 * const stop = listenNativeScanner(POS_DEVICE_FAMILIES.pax, (code) => cart.addByBarcode(code));
 */
export function listenNativeScanner(
  family: PosDeviceFamily,
  listener: (code: string) => void,
): () => void {
  const subscription = nativeDevice(family)?.addListener("onScan", (event) => {
    if (typeof event.code === "string" && event.code.length > 0) listener(event.code);
  });
  return () => subscription?.remove();
}
