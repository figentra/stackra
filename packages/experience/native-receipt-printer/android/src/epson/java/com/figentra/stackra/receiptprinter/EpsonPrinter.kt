// Stackra file contract:
// Purpose: the Epson family of the `StackraReceiptPrinter` module: a pass-through to Epson's ePOS SDK for Android
//          (`com.epson.epos2.printer.Printer`) on a network target (`TCP:<host>`).
// Boundary: compiled only when the runway lists `device:epson`. It returns `PrinterStatusInfo.online` as the status,
//           prints text with a feed cut, and pulses `DRAWER_2PIN` or `DRAWER_5PIN`. One connection per call, closed
//           after it. The series is the generic TM-T88 class; another series is a certification row (STA-739).
// Runtime: android
// Governing contract: ADR 0478 (decisions 2, 4 and 5); ADR 0253 (decision 4).
package com.figentra.stackra.receiptprinter

import android.content.Context
import com.epson.epos2.Epos2Exception
import com.epson.epos2.printer.Printer
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/** Epson ePOS, passed through. */
class EpsonPrinter : VendorPrinter {
  override suspend fun status(context: Context, target: String): Int =
    connected(context, target) { printer -> printer.status.online }

  override suspend fun printLines(context: Context, target: String, lines: List<String>) =
    connected(context, target) { printer ->
      lines.forEach { line -> printer.addText("$line\n") }
      printer.addCut(Printer.CUT_FEED)
      send(printer)
    }

  override suspend fun kickDrawer(context: Context, target: String, pin: Int) =
    connected(context, target) { printer ->
      printer.addPulse(if (pin == 5) Printer.DRAWER_5PIN else Printer.DRAWER_2PIN, Printer.PULSE_100)
      send(printer)
    }

  /** Runs `block` on a printer connected to `target`, then disconnects. */
  private suspend fun <T> connected(context: Context, target: String, block: suspend (Printer) -> T): T =
    withContext(Dispatchers.IO) {
      val printer = Printer(Printer.TM_T88, Printer.MODEL_ANK, context)
      printer.connect(target, Printer.PARAM_DEFAULT)
      try {
        block(printer)
      } finally {
        printer.clearCommandBuffer()
        printer.disconnect()
      }
    }

  /** Sends the buffer and waits for the printer's answer; a code other than success throws. */
  private suspend fun send(printer: Printer) {
    val answer = CompletableDeferred<Int>()
    printer.setReceiveEventListener { _, code, _, _ -> answer.complete(code) }
    printer.sendData(Printer.PARAM_DEFAULT)
    val code = answer.await()
    if (code != 0) throw Epos2Exception(code)
  }
}
