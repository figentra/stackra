// Stackra file contract:
// Purpose: `NativeScaleModule`, the Android side of the `StackraNativeScale` Expo module: `connect` opens one link
//          (`BleLink`, `SppLink` or the USB serial link) off the main thread, `disconnect` closes it, `isConnected`
//          answers, `write` sends a command as Latin-1 text, and the `onData` event carries each chunk the scale sends.
// Boundary: a pass-through (ADR 0478 decision 5): no framing, parsing or mapping, which stay in the TypeScript
//           drivers. One link at a time. Checked on the box and on certified models (STA-739), never on a developer
//           Mac.
// Runtime: Android
// Governing contract: ADR 0478 (decisions 2, 4 and 5).
package com.figentra.stackra.nativescale

import android.content.Context
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.concurrent.Executors

class NativeScaleModule : Module() {
  private val worker = Executors.newSingleThreadExecutor()

  @Volatile
  private var link: ScaleLinkTransport? = null

  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("StackraNativeScale")

    Events("onData")

    AsyncFunction("connect") { record: ScaleLinkRecord, promise: Promise ->
      worker.execute {
        try {
          link?.close()
          link = null
          val emit: (String) -> Unit = { text -> sendEvent("onData", mapOf("text" to text)) }
          val next = when (record.transport) {
            "ble" -> BleLink(context, record, emit)
            "spp" -> SppLink(context, record, emit)
            "usb" -> UsbLinks.create(context, record, emit)
            else -> throw ScaleLinkException.unavailable("${record.transport} is no transport.")
          }
          next.open()
          link = next
          promise.resolve(null)
        } catch (error: ScaleLinkException) {
          promise.reject(error)
        } catch (error: Exception) {
          promise.reject(ScaleLinkException.unavailable(error.message ?: "The link failed.", error))
        }
      }
    }

    AsyncFunction("disconnect") { promise: Promise ->
      worker.execute {
        link?.close()
        link = null
        promise.resolve(null)
      }
    }

    AsyncFunction("isConnected") {
      link?.isOpen == true
    }

    AsyncFunction("write") { text: String, promise: Promise ->
      worker.execute {
        try {
          val open = link ?: throw ScaleLinkException.unavailable("The scale link is not open.")
          open.write(text)
          promise.resolve(null)
        } catch (error: ScaleLinkException) {
          promise.reject(error)
        }
      }
    }

    OnDestroy {
      link?.close()
      link = null
      worker.shutdown()
    }
  }
}
