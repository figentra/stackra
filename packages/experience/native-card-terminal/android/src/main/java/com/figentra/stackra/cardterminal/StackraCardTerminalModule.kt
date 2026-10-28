// Stackra file contract:
// Purpose: StackraCardTerminalModule, the Expo module `StackraCardTerminal` on Android: a pass-through over Stripe
//          Terminal's Android SDK. It initialises the SDK with the token relay, asks for the Bluetooth and location
//          permissions, discovers and connects Bluetooth readers and this phone as a Tap to Pay reader, reports the
//          connected reader and the payment status, retrieves, collects and confirms a server-created intent, cancels a
//          collect, disconnects.
// Boundary: every SDK call resolves with the SDK's answer or `{ error }` and never rejects; enum names cross as the
//           SDK names them and the TypeScript drivers decide what they mean. Never creates a payment intent, never
//           enables offline mode, holds no key (ADR 0479 decisions 4 and 5). Card data never crosses to JavaScript.
//           Certification pending (STA-739): written from Stripe's public SDK documents, not built on a developer Mac.
// Runtime: android
// Governing contract: ADR 0479 (decisions 1, 4 and 5); ADR 0478 (decisions 2, 4 and 5).
package com.figentra.stackra.cardterminal

import android.Manifest
import android.os.Build
import com.stripe.stripeterminal.Terminal
import com.stripe.stripeterminal.external.callable.Callback
import com.stripe.stripeterminal.external.callable.Cancelable
import com.stripe.stripeterminal.external.callable.DiscoveryListener
import com.stripe.stripeterminal.external.callable.PaymentIntentCallback
import com.stripe.stripeterminal.external.callable.ReaderCallback
import com.stripe.stripeterminal.external.models.ConnectionConfiguration
import com.stripe.stripeterminal.external.models.DeviceType
import com.stripe.stripeterminal.external.models.DiscoveryConfiguration
import com.stripe.stripeterminal.external.models.PaymentIntent
import com.stripe.stripeterminal.external.models.Reader
import com.stripe.stripeterminal.external.models.ReaderSupportResult
import com.stripe.stripeterminal.external.models.TerminalErrorCode
import com.stripe.stripeterminal.external.models.TerminalException
import com.stripe.stripeterminal.log.LogLevel
import expo.modules.interfaces.permissions.PermissionsResponseListener
import expo.modules.interfaces.permissions.PermissionsStatus
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.concurrent.atomic.AtomicBoolean

class StackraCardTerminalModule : Module() {
  private var relay: ConnectionTokenRelay? = null
  private var discovery: Cancelable? = null
  private var discovered: List<Reader> = emptyList()
  private var collect: Cancelable? = null

  private fun terminalPermissions(): Array<String> =
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      arrayOf(
        Manifest.permission.BLUETOOTH_SCAN,
        Manifest.permission.BLUETOOTH_CONNECT,
        Manifest.permission.ACCESS_FINE_LOCATION,
      )
    } else {
      arrayOf(Manifest.permission.ACCESS_FINE_LOCATION)
    }

  private fun answer(promise: Promise, error: TerminalException) {
    promise.resolve(mapOf("error" to SdkNames.error(error)))
  }

  override fun definition() = ModuleDefinition {
    Name("StackraCardTerminal")

    Events("onConnectionTokenRequest")

    AsyncFunction("initialize") {
      if (Terminal.isInitialized()) return@AsyncFunction
      val context = appContext.reactContext?.applicationContext ?: return@AsyncFunction
      val relay = ConnectionTokenRelay { requestId ->
        sendEvent("onConnectionTokenRequest", mapOf("requestId" to requestId))
      }
      this@StackraCardTerminalModule.relay = relay
      Terminal.initTerminal(context, LogLevel.NONE, relay, ReaderEvents)
    }

    Function("resolveConnectionToken") { requestId: String, token: String ->
      relay?.resolve(requestId, token)
    }

    Function("rejectConnectionToken") { requestId: String, message: String ->
      relay?.reject(requestId, message)
    }

    AsyncFunction("requestPermissions") { promise: Promise ->
      val permissions = appContext.permissions
      if (permissions == null) {
        promise.resolve(mapOf("granted" to false))
        return@AsyncFunction
      }
      permissions.askForPermissions(
        PermissionsResponseListener { result ->
          val granted = result.values.all { it.status == PermissionsStatus.GRANTED }
          promise.resolve(mapOf("granted" to granted))
        },
        *terminalPermissions(),
      )
    }

    AsyncFunction("discoverBluetoothReaders") { timeoutMs: Int, serialNumber: String, promise: Promise ->
      discovery?.cancel(NoOpCallback)
      discovered = emptyList()
      val settled = AtomicBoolean(false)
      val config = DiscoveryConfiguration.BluetoothDiscoveryConfiguration(
        timeout = maxOf(1, timeoutMs / 1000),
        isSimulated = false,
      )
      discovery = Terminal.getInstance().discoverReaders(
        config,
        DiscoveryListener { readers ->
          discovered = readers
          if (readers.any { it.serialNumber == serialNumber } && settled.compareAndSet(false, true)) {
            promise.resolve(mapOf("readers" to readers.map(SdkNames::reader)))
          }
        },
        object : Callback {
          override fun onSuccess() {
            if (settled.compareAndSet(false, true)) {
              promise.resolve(mapOf("readers" to discovered.map(SdkNames::reader)))
            }
          }

          override fun onFailure(e: TerminalException) {
            if (!settled.compareAndSet(false, true)) return
            if (e.errorCode == TerminalErrorCode.CANCELED) {
              promise.resolve(mapOf("readers" to discovered.map(SdkNames::reader)))
            } else {
              answer(promise, e)
            }
          }
        },
      )
    }

    AsyncFunction("connectBluetoothReader") { serialNumber: String, locationId: String, promise: Promise ->
      val reader = discovered.firstOrNull { it.serialNumber == serialNumber }
      if (reader == null) {
        promise.resolve(mapOf("error" to SdkNames.errorOf("READER_NOT_DISCOVERED")))
        return@AsyncFunction
      }
      val config = ConnectionConfiguration.BluetoothConnectionConfiguration(
        locationId = locationId,
        autoReconnectOnUnexpectedDisconnect = true,
        bluetoothReaderListener = ReaderEvents,
      )
      Terminal.getInstance().connectReader(
        reader,
        config,
        object : ReaderCallback {
          override fun onSuccess(reader: Reader) {
            discovery?.cancel(NoOpCallback)
            discovery = null
            promise.resolve(mapOf("reader" to SdkNames.reader(reader)))
          }

          override fun onFailure(e: TerminalException) = answer(promise, e)
        },
      )
    }

    AsyncFunction("supportsTapToPay") {
      val result = Terminal.getInstance().supportsReadersOfType(
        DeviceType.TAP_TO_PAY_DEVICE,
        DiscoveryConfiguration.TapToPayDiscoveryConfiguration(isSimulated = false),
      )
      when (result) {
        is ReaderSupportResult.Supported -> mapOf("supported" to true)
        is ReaderSupportResult.NotSupported ->
          mapOf("supported" to false, "error" to SdkNames.error(result.error))
      }
    }

    AsyncFunction("connectTapToPay") { locationId: String, promise: Promise ->
      val settled = AtomicBoolean(false)
      discovery = Terminal.getInstance().discoverReaders(
        DiscoveryConfiguration.TapToPayDiscoveryConfiguration(isSimulated = false),
        DiscoveryListener { readers ->
          val reader = readers.firstOrNull() ?: return@DiscoveryListener
          if (!settled.compareAndSet(false, true)) return@DiscoveryListener
          Terminal.getInstance().connectReader(
            reader,
            ConnectionConfiguration.TapToPayConnectionConfiguration(
              locationId = locationId,
              autoReconnectOnUnexpectedDisconnect = true,
              tapToPayReaderListener = ReaderEvents,
            ),
            object : ReaderCallback {
              override fun onSuccess(reader: Reader) {
                promise.resolve(mapOf("reader" to SdkNames.reader(reader)))
              }

              override fun onFailure(e: TerminalException) = answer(promise, e)
            },
          )
        },
        object : Callback {
          override fun onSuccess() = Unit

          override fun onFailure(e: TerminalException) {
            if (e.errorCode != TerminalErrorCode.CANCELED && settled.compareAndSet(false, true)) {
              answer(promise, e)
            }
          }
        },
      )
    }

    AsyncFunction("connectedReader") {
      Terminal.getInstance().connectedReader?.let(SdkNames::reader)
    }

    AsyncFunction("paymentStatus") {
      Terminal.getInstance().paymentStatus.name
    }

    AsyncFunction("collectAndConfirm") { clientSecret: String, promise: Promise ->
      val terminal = Terminal.getInstance()
      terminal.retrievePaymentIntent(
        clientSecret,
        object : PaymentIntentCallback {
          override fun onSuccess(paymentIntent: PaymentIntent) {
            collect = terminal.collectPaymentMethod(
              paymentIntent,
              object : PaymentIntentCallback {
                override fun onSuccess(paymentIntent: PaymentIntent) {
                  collect = null
                  terminal.confirmPaymentIntent(
                    paymentIntent,
                    object : PaymentIntentCallback {
                      override fun onSuccess(paymentIntent: PaymentIntent) {
                        promise.resolve(
                          mapOf(
                            "paymentIntent" to mapOf(
                              "id" to (paymentIntent.id ?: ""),
                              "status" to (paymentIntent.status?.name ?: "UNKNOWN"),
                            ),
                          ),
                        )
                      }

                      override fun onFailure(e: TerminalException) = answer(promise, e)
                    },
                  )
                }

                override fun onFailure(e: TerminalException) {
                  collect = null
                  answer(promise, e)
                }
              },
            )
          }

          override fun onFailure(e: TerminalException) = answer(promise, e)
        },
      )
    }

    AsyncFunction("cancelCollect") { promise: Promise ->
      val running = collect
      if (running == null) {
        promise.resolve(mapOf("error" to SdkNames.errorOf("NO_COLLECT_IN_PROGRESS")))
        return@AsyncFunction
      }
      running.cancel(
        object : Callback {
          override fun onSuccess() {
            promise.resolve(emptyMap<String, Any?>())
          }

          override fun onFailure(e: TerminalException) = answer(promise, e)
        },
      )
    }

    AsyncFunction("disconnectReader") { promise: Promise ->
      Terminal.getInstance().disconnectReader(
        object : Callback {
          override fun onSuccess() {
            promise.resolve(emptyMap<String, Any?>())
          }

          override fun onFailure(e: TerminalException) = answer(promise, e)
        },
      )
    }
  }

  /** A cancel whose outcome nothing waits on. */
  private object NoOpCallback : Callback {
    override fun onSuccess() = Unit

    override fun onFailure(e: TerminalException) = Unit
  }
}
