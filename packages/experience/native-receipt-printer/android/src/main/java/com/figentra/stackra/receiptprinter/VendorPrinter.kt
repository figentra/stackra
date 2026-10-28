// Stackra file contract:
// Purpose: `VendorPrinter`, what one vendor family's pass-through does: read the printer's raw status, print text
//          lines and pulse the drawer, each a direct call to the vendor SDK.
// Boundary: an interface only. An implementation maps nothing: the status is the SDK's own number (the TypeScript
//           driver reads it through the family's ready codes), lines are text, and an SDK failure is thrown so the
//           module rejects and the driver refuses.
// Runtime: android
// Governing contract: ADR 0478 (decisions 2 and 5); ADR 0458 (decision 2); ADR 0459 (decision 2).
package com.figentra.stackra.receiptprinter

import android.content.Context

/** One vendor family's printer SDK, passed through. */
interface VendorPrinter {
  /** The printer's status exactly as the SDK returns it. */
  suspend fun status(context: Context, target: String): Int

  /** Prints `lines` as text, feeds, and cuts where the model has a cutter. */
  suspend fun printLines(context: Context, target: String, lines: List<String>)

  /** Pulses the drawer connector on `pin` (2 or 5); a built-in drawer port ignores it. */
  suspend fun kickDrawer(context: Context, target: String, pin: Int)
}
