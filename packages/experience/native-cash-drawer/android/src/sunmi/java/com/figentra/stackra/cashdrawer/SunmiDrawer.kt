// Stackra file contract:
// Purpose: the Sunmi family of the `StackraCashDrawer` module: a pass-through to the Sunmi printer service
//          (`woyou.aidlservice.jiuiv5`, bound through Sunmi's printer library) for the drawer on the terminal's drawer
//          port. Moved from the till app's `src/native-sources/sunmi/` (ADR 0478 decision 5).
// Boundary: compiled only when the runway lists `device:sunmi`. `updatePrinterState()` for the status of the printer
//           that drives the drawer, `openDrawer()` for the pulse. The service is bound once and kept.
// Runtime: android
// Governing contract: ADR 0478 (decisions 2, 4 and 5); ADR 0458 (decisions 2, 3 and 6).
package com.figentra.stackra.cashdrawer

import android.content.Context
import com.sunmi.peripheral.printer.InnerPrinterCallback
import com.sunmi.peripheral.printer.InnerPrinterManager
import com.sunmi.peripheral.printer.SunmiPrinterService
import kotlinx.coroutines.CompletableDeferred

/** The Sunmi drawer port, passed through. */
class SunmiDrawer : VendorDrawer {
  /** The bound service, once bound. */
  private var service: CompletableDeferred<SunmiPrinterService>? = null

  override suspend fun status(context: Context): Int = bound(context).updatePrinterState()

  override suspend fun open(context: Context) = bound(context).openDrawer(null)

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
            synchronized(this@SunmiDrawer) { service = null }
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
