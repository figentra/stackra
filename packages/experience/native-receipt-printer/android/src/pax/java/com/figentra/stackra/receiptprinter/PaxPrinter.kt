// Stackra file contract:
// Purpose: the PAX family of the `StackraReceiptPrinter` module: a pass-through to PAX's NeptuneLite API (`IDAL`) for
//          the terminal's printer and drawer port. Moved from the till app's `src/native-sources/pax/` (ADR 0478
//          decision 5).
// Boundary: compiled only when the runway lists `device:pax`. `IPrinter.getStatus()` for the status; `init`, text
//           printing, a feed and `start` to print; the cash drawer's `open()` (no pin) for the kick. A non-zero
//           answer from `start` or `open` throws, so the driver refuses. The target is empty.
// Runtime: android
// Governing contract: ADR 0478 (decisions 2, 4 and 5); ADR 0459 (decisions 2 and 6).
package com.figentra.stackra.receiptprinter

import android.content.Context
import com.pax.dal.IDAL
import com.pax.neptunelite.api.NeptuneLiteUser
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/** PAX NeptuneLite, passed through. */
class PaxPrinter : VendorPrinter {
  override suspend fun status(context: Context, target: String): Int =
    withContext(Dispatchers.IO) { dal(context).printer.status }

  override suspend fun printLines(context: Context, target: String, lines: List<String>) =
    withContext(Dispatchers.IO) {
      val printer = dal(context).printer
      printer.init()
      lines.forEach { line -> printer.printStr("$line\n", null) }
      printer.step(120)
      val code = printer.start()
      if (code != 0) throw IllegalStateException("PAX printer answered $code")
    }

  override suspend fun kickDrawer(context: Context, target: String, pin: Int) =
    withContext(Dispatchers.IO) {
      val code = dal(context).cashDrawer.open()
      if (code != 0) throw IllegalStateException("PAX cash drawer answered $code")
    }

  /** The terminal's device abstraction layer. */
  private fun dal(context: Context): IDAL = NeptuneLiteUser.getInstance().getDal(context)
}
