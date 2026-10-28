// Stackra file contract:
// Purpose: the Star family of the `StackraReceiptPrinter` module: a pass-through to Star's StarXpand SDK for Android
//          (`com.starmicronics.stario10`) on a LAN target (the printer's host).
// Boundary: compiled only when the runway lists `device:star`. It returns `StarPrinterStatus.hasError` as 1 or 0,
//           prints text with a partial cut, and opens drawer channel 1 for pin 2 and channel 2 for pin 5. One
//           connection per call, closed after it.
// Runtime: android
// Governing contract: ADR 0478 (decisions 2, 4 and 5); ADR 0253 (decision 4).
package com.figentra.stackra.receiptprinter

import android.content.Context
import com.starmicronics.stario10.InterfaceType
import com.starmicronics.stario10.StarConnectionSettings
import com.starmicronics.stario10.StarPrinter as StarSdkPrinter
import com.starmicronics.stario10.starxpandcommand.DocumentBuilder
import com.starmicronics.stario10.starxpandcommand.DrawerBuilder
import com.starmicronics.stario10.starxpandcommand.PrinterBuilder
import com.starmicronics.stario10.starxpandcommand.StarXpandCommandBuilder
import com.starmicronics.stario10.starxpandcommand.drawer.Channel
import com.starmicronics.stario10.starxpandcommand.drawer.OpenParameter
import com.starmicronics.stario10.starxpandcommand.printer.CutType

/** Star StarXpand, passed through. */
class StarPrinter : VendorPrinter {
  override suspend fun status(context: Context, target: String): Int =
    opened(context, target) { printer -> if (printer.getStatusAsync().await().hasError) 1 else 0 }

  override suspend fun printLines(context: Context, target: String, lines: List<String>) =
    opened(context, target) { printer ->
      val page = PrinterBuilder()
      lines.forEach { line -> page.actionPrintText("$line\n") }
      page.actionCut(CutType.Partial)
      printer.printAsync(StarXpandCommandBuilder().addDocument(DocumentBuilder().addPrinter(page)).getCommands()).await()
      Unit
    }

  override suspend fun kickDrawer(context: Context, target: String, pin: Int) =
    opened(context, target) { printer ->
      val channel = if (pin == 5) Channel.No2 else Channel.No1
      val drawer = DrawerBuilder().actionOpen(OpenParameter().setChannel(channel))
      printer.printAsync(StarXpandCommandBuilder().addDocument(DocumentBuilder().addDrawer(drawer)).getCommands()).await()
      Unit
    }

  /** Runs `block` on a printer opened at `target`, then closes it. */
  private suspend fun <T> opened(context: Context, target: String, block: suspend (StarSdkPrinter) -> T): T {
    val printer = StarSdkPrinter(StarConnectionSettings(InterfaceType.Lan, target), context)
    printer.openAsync().await()
    try {
      return block(printer)
    } finally {
      printer.closeAsync().await()
    }
  }
}
