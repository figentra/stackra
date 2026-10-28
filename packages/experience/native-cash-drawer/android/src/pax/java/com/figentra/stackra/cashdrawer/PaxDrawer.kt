// Stackra file contract:
// Purpose: the PAX family of the `StackraCashDrawer` module: a pass-through to PAX's NeptuneLite API (`IDAL`) for the
//          drawer on the terminal's drawer port. Moved from the till app's `src/native-sources/pax/` (ADR 0478
//          decision 5).
// Boundary: compiled only when the runway lists `device:pax`. `IPrinter.getStatus()` for the status of the printer that
//           drives the drawer, the cash drawer's `open()` for the pulse; a non-zero answer from `open` throws.
// Runtime: android
// Governing contract: ADR 0478 (decisions 2, 4 and 5); ADR 0459 (decisions 2, 3 and 6).
package com.figentra.stackra.cashdrawer

import android.content.Context
import com.pax.dal.IDAL
import com.pax.neptunelite.api.NeptuneLiteUser
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/** The PAX drawer port, passed through. */
class PaxDrawer : VendorDrawer {
  override suspend fun status(context: Context): Int =
    withContext(Dispatchers.IO) { dal(context).printer.status }

  override suspend fun open(context: Context) =
    withContext(Dispatchers.IO) {
      val code = dal(context).cashDrawer.open()
      if (code != 0) throw IllegalStateException("PAX cash drawer answered $code")
    }

  /** The terminal's device abstraction layer. */
  private fun dal(context: Context): IDAL = NeptuneLiteUser.getInstance().getDal(context)
}
