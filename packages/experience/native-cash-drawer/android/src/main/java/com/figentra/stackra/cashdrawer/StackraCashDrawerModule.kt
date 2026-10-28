// Stackra file contract:
// Purpose: the Android half of the `StackraCashDrawer` Expo module: `status` and `open`, each handed to the named drawer
//          port family's `VendorDrawer`.
// Boundary: a pass-through. A family's class exists only when the build links it (its source set is compiled only when
//           the runway lists it), so it is found by name and a family the build does not link rejects. It decides
//           nothing: readiness and refusals are the TypeScript driver's.
// Runtime: android
// Governing contract: ADR 0478 (decisions 2 and 5); ADR 0458 (decision 2); ADR 0459 (decision 2).
package com.figentra.stackra.cashdrawer

import android.content.Context
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/** The cash drawer module. */
class StackraCashDrawerModule : Module() {
  /** The linked families, created on first use. */
  private val drawers = mutableMapOf<String, VendorDrawer>()

  override fun definition() = ModuleDefinition {
    Name("StackraCashDrawer")

    AsyncFunction("status") Coroutine { vendor: String -> drawer(vendor).status(context()) }

    AsyncFunction("open") Coroutine { vendor: String -> drawer(vendor).open(context()) }
  }

  /** The app context the SDKs bind with. */
  private fun context(): Context =
    appContext.reactContext?.applicationContext ?: throw CodedException("ERR_NO_CONTEXT", "The app has no context", null)

  /** The family's drawer, or a rejection when the build does not link it. */
  private fun drawer(vendor: String): VendorDrawer = synchronized(drawers) {
    drawers.getOrPut(vendor) {
      val name = vendor.replaceFirstChar { it.uppercase() }
      try {
        Class.forName("com.figentra.stackra.cashdrawer.${name}Drawer")
          .getDeclaredConstructor().newInstance() as VendorDrawer
      } catch (error: ClassNotFoundException) {
        throw CodedException("ERR_VENDOR_NOT_LINKED", "This build does not link the $vendor drawer", error)
      }
    }
  }
}
