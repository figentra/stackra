// Stackra file contract:
// Purpose: the Sunmi family of the `StackraReceiptPrinter` module: a pass-through to the Sunmi printer service
//          (`woyou.aidlservice.jiuiv5`, bound through Sunmi's printer library). Moved from the till app's
//          `src/native-sources/sunmi/` (ADR 0478 decision 5).
// Boundary: compiled only when the runway lists `device:sunmi`. `updatePrinterState()` for the status, text printing
//           with a line feed and the paper cut on models with a cutter, and `openDrawer()` (no pin) for the drawer. The
//           target is empty: the printer is the terminal's own. The service is bound once and kept.
// Runtime: android
// Governing contract: ADR 0478 (decisions 2, 4 and 5); ADR 0458 (decisions 2 and 6).
package com.figentra.stackra.receiptprinter

import android.content.Context
import com.sunmi.peripheral.printer.InnerPrinterCallback
import com.sunmi.peripheral.printer.InnerPrinterManager
import com.sunmi.peripheral.printer.SunmiPrinterService
import kotlinx.coroutines.CompletableDeferred

/** The Sunmi printer service, passed through. */
class SunmiPrinter : VendorPrinter {
  /** The bound service, once bound. */
  private var service: CompletableDeferred<SunmiPrinterService>? = null

  override suspend fun status(context: Context, target: String): Int = bound(context).updatePrinterState()

  override suspend fun printLines(context: Context, target: String, lines: List<String>) {
    val printer = bound(context)
    lines.forEach { line -> printer.printText("$line\n", null) }
    printer.lineWrap(3, null)
    printer.cutPaper(null)
  }

  override suspend fun kickDrawer(context: Context, target: String, pin: Int) = bound(context).openDrawer(null)

  /** The printer service, bound on first use; a failed bind throws. */
  private suspend fun bound(context: Context): SunmiPrinterService {
    val pending = synchronized(this) {
      service ?: CompletableDeferred<SunmiPrinterService>().also { deferred ->
        service = deferred
        val callback = object : InnerPrinterCallback() {
          override fun onConnected(connected: SunmiPrinterService) {
            deferred.complete(connected)
          }

          override fun onDisconnected() {
            synchronized(this@SunmiPrinter) { service = null }
          }
        }
        if (!InnerPrinterManager.getInstance().bindService(context, callback)) {
          service = null
          deferred.completeExceptionally(IllegalStateException("The Sunmi printer service is not on this device"))
        }
      }
    }
    return pending.await()
  }
}
