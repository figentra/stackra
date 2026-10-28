// Stackra file contract:
// Purpose: the Android half of the `StackraReceiptPrinter` Expo module: `status`, `printLines` and `kickDrawer`, each
//          handed to the named vendor family's `VendorPrinter`.
// Boundary: a pass-through. A family's class exists only when the build links it (its source set is compiled only
//           when the runway lists it), so it is found by name and a family the build does not link rejects. It decides
//           nothing: readiness and refusals are the TypeScript driver's.
// Runtime: android
// Governing contract: ADR 0478 (decisions 2 and 5); ADR 0458 (decision 2); ADR 0459 (decision 2).
package com.figentra.stackra.receiptprinter

import android.content.Context
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/** The receipt printer module. */
class StackraReceiptPrinterModule : Module() {
  /** The linked families, created on first use. */
  private val printers = mutableMapOf<String, VendorPrinter>()

  override fun definition() = ModuleDefinition {
    Name("StackraReceiptPrinter")

    AsyncFunction("status") Coroutine { vendor: String, target: String ->
      printer(vendor).status(context(), target)
    }

    AsyncFunction("printLines") Coroutine { vendor: String, target: String, lines: List<String> ->
      printer(vendor).printLines(context(), target, lines)
    }

    AsyncFunction("kickDrawer") Coroutine { vendor: String, target: String, pin: Int ->
      printer(vendor).kickDrawer(context(), target, pin)
    }
  }

  /** The app context the SDKs bind with. */
  private fun context(): Context =
    appContext.reactContext?.applicationContext ?: throw CodedException("ERR_NO_CONTEXT", "The app has no context", null)

  /** The family's printer, or a rejection when the build does not link it. */
  private fun printer(vendor: String): VendorPrinter = synchronized(printers) {
    printers.getOrPut(vendor) {
      val name = vendor.replaceFirstChar { it.uppercase() }
      try {
        Class.forName("com.figentra.stackra.receiptprinter.${name}Printer")
          .getDeclaredConstructor().newInstance() as VendorPrinter
      } catch (error: ClassNotFoundException) {
        throw CodedException("ERR_VENDOR_NOT_LINKED", "This build does not link the $vendor printer", error)
      }
    }
  }
}
