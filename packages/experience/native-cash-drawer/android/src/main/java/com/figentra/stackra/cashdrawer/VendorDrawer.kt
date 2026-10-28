// Stackra file contract:
// Purpose: `VendorDrawer`, what one drawer port family's pass-through does: read the raw status of the printer that
//          drives the drawer, and pulse the drawer port, each a direct call to the vendor SDK.
// Boundary: an interface only. An implementation maps nothing: the status is the SDK's own number (the TypeScript
//           driver reads it through the family's ready codes) and an SDK failure is thrown so the module rejects.
// Runtime: android
// Governing contract: ADR 0478 (decisions 2 and 5); ADR 0458 (decisions 2 and 3); ADR 0459 (decisions 2 and 3).
package com.figentra.stackra.cashdrawer

import android.content.Context

/** One family's drawer port, passed through. */
interface VendorDrawer {
  /** The status of the printer that drives the drawer, exactly as the SDK returns it. */
  suspend fun status(context: Context): Int

  /** Pulses the drawer port. */
  suspend fun open(context: Context)
}
