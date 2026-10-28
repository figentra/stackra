// Stackra file contract:
// Purpose: StackraCardTerminalModule, the Expo module `StackraCardTerminal` on iOS: a pass-through over Stripe
//          Terminal's iOS SDK. It initialises the SDK with the token relay, asks for permissions, discovers and
//          connects Bluetooth readers and this iPhone as a Tap to Pay reader, reports the connected reader and the
//          payment status, retrieves, collects and confirms a server-created intent, cancels a collect, disconnects.
// Boundary: maps nothing but enum names (SdkNames): every SDK call resolves with the SDK's answer or `{ error }` and
//           never rejects; the TypeScript drivers decide what an answer means. Never creates a payment intent, never
//           enables offline mode, holds no key (ADR 0479 decisions 4 and 5). Card data never crosses to JavaScript.
//           Certification pending (STA-739): written from Stripe's public SDK documents, not built on a developer Mac.
// Runtime: ios
// Governing contract: ADR 0479 (decisions 1, 4 and 5); ADR 0478 (decisions 2, 4 and 5).
import ExpoModulesCore
import StripeTerminal

public class StackraCardTerminalModule: Module {
  private var relay: ConnectionTokenRelay?
  private let readerEvents = ReaderEvents()
  private let location = LocationPermission()
  private var discovery: Cancelable?
  private var discovered: [Reader] = []
  private var collect: Cancelable?

  public func definition() -> ModuleDefinition {
    Name("StackraCardTerminal")

    Events("onConnectionTokenRequest")

    AsyncFunction("initialize") {
      if Terminal.hasTokenProvider() { return }
      let relay = ConnectionTokenRelay { [weak self] requestId in
        self?.sendEvent("onConnectionTokenRequest", ["requestId": requestId])
      }
      self.relay = relay
      Terminal.setTokenProvider(relay)
    }

    Function("resolveConnectionToken") { (requestId: String, token: String) in
      self.relay?.resolve(requestId, token: token)
    }

    Function("rejectConnectionToken") { (requestId: String, message: String) in
      self.relay?.reject(requestId, message: message)
    }

    AsyncFunction("requestPermissions") { (promise: Promise) in
      guard LocationPermission.isBluetoothAllowed else {
        promise.resolve(["granted": false])
        return
      }
      DispatchQueue.main.async {
        self.location.request { granted in promise.resolve(["granted": granted]) }
      }
    }

    AsyncFunction("discoverBluetoothReaders") { (timeoutMs: Int, serialNumber: String, promise: Promise) in
      self.discovery?.cancel { _ in }
      self.discovered = []
      var settled = false
      let settle: ([String: Any]) -> Void = { answer in
        if settled { return }
        settled = true
        promise.resolve(answer)
      }
      let config: DiscoveryConfiguration
      do {
        config = try BluetoothScanDiscoveryConfigurationBuilder()
          .setTimeout(UInt(max(1, timeoutMs / 1000)))
          .build()
      } catch {
        settle(["error": SdkNames.error(error)])
        return
      }
      self.readerEvents.onDiscover = { [weak self] readers in
        self?.discovered = readers
        if readers.contains(where: { $0.serialNumber == serialNumber }) {
          settle(["readers": readers.map(SdkNames.reader)])
        }
      }
      self.discovery = Terminal.shared.discoverReaders(config, delegate: self.readerEvents) { error in
        if let error = error, (error as NSError).code != ErrorCode.Code.canceled.rawValue {
          settle(["error": SdkNames.error(error)])
        } else {
          settle(["readers": self.discovered.map(SdkNames.reader)])
        }
      }
    }

    AsyncFunction("connectBluetoothReader") { (serialNumber: String, locationId: String, promise: Promise) in
      guard let reader = self.discovered.first(where: { $0.serialNumber == serialNumber }) else {
        promise.resolve(["error": ["code": "readerNotDiscovered"]])
        return
      }
      let config: BluetoothConnectionConfiguration
      do {
        config = try BluetoothConnectionConfigurationBuilder(delegate: self.readerEvents, locationId: locationId)
          .build()
      } catch {
        promise.resolve(["error": SdkNames.error(error)])
        return
      }
      Terminal.shared.connectReader(reader, connectionConfig: config) { connected, error in
        self.discovery?.cancel { _ in }
        self.discovery = nil
        if let error = error {
          promise.resolve(["error": SdkNames.error(error)])
        } else if let connected = connected {
          promise.resolve(["reader": SdkNames.reader(connected)])
        } else {
          promise.resolve([:])
        }
      }
    }

    AsyncFunction("supportsTapToPay") { () -> [String: Any] in
      switch Terminal.shared.supportsReaders(of: .tapToPay, discoveryMethod: .tapToPay, simulated: false) {
      case .success: return ["supported": true]
      case .failure(let error): return ["supported": false, "error": SdkNames.error(error)]
      }
    }

    AsyncFunction("connectTapToPay") { (locationId: String, promise: Promise) in
      let discoveryConfig: DiscoveryConfiguration
      do {
        discoveryConfig = try TapToPayDiscoveryConfigurationBuilder().build()
      } catch {
        promise.resolve(["error": SdkNames.error(error)])
        return
      }
      var settled = false
      self.readerEvents.onDiscover = { [weak self] readers in
        guard let self = self, !settled, let reader = readers.first else { return }
        settled = true
        do {
          let config = try TapToPayConnectionConfigurationBuilder(
            delegate: self.readerEvents, locationId: locationId
          ).build()
          Terminal.shared.connectReader(reader, connectionConfig: config) { connected, error in
            if let error = error {
              promise.resolve(["error": SdkNames.error(error)])
            } else if let connected = connected {
              promise.resolve(["reader": SdkNames.reader(connected)])
            } else {
              promise.resolve([:])
            }
          }
        } catch {
          promise.resolve(["error": SdkNames.error(error)])
        }
      }
      self.discovery = Terminal.shared.discoverReaders(discoveryConfig, delegate: self.readerEvents) { error in
        if let error = error, !settled, (error as NSError).code != ErrorCode.Code.canceled.rawValue {
          settled = true
          promise.resolve(["error": SdkNames.error(error)])
        }
      }
    }

    AsyncFunction("connectedReader") { () -> [String: Any]? in
      Terminal.shared.connectedReader.map(SdkNames.reader)
    }

    AsyncFunction("paymentStatus") { () -> String in
      SdkNames.paymentStatus(Terminal.shared.paymentStatus)
    }

    AsyncFunction("collectAndConfirm") { (clientSecret: String, promise: Promise) in
      Terminal.shared.retrievePaymentIntent(clientSecret: clientSecret) { intent, error in
        guard let intent = intent else {
          promise.resolve(["error": error.map(SdkNames.error) ?? ["code": "intentNotRetrieved"]])
          return
        }
        self.collect = Terminal.shared.collectPaymentMethod(intent) { collected, error in
          self.collect = nil
          guard let collected = collected else {
            promise.resolve(["error": error.map(SdkNames.error) ?? ["code": "collectFailed"]])
            return
          }
          Terminal.shared.confirmPaymentIntent(collected) { confirmed, error in
            if let confirmed = confirmed {
              promise.resolve([
                "paymentIntent": [
                  "id": confirmed.stripeId ?? "",
                  "status": SdkNames.intentStatus(confirmed.status),
                ]
              ])
            } else {
              promise.resolve(["error": error.map(SdkNames.error) ?? ["code": "confirmFailed"]])
            }
          }
        }
      }
    }

    AsyncFunction("cancelCollect") { (promise: Promise) in
      guard let collect = self.collect else {
        promise.resolve(["error": ["code": "noCollectInProgress"]])
        return
      }
      collect.cancel { error in
        promise.resolve(error.map { ["error": SdkNames.error($0)] } ?? [:])
      }
    }

    AsyncFunction("disconnectReader") { (promise: Promise) in
      Terminal.shared.disconnectReader { error in
        promise.resolve(error.map { ["error": SdkNames.error($0)] } ?? [:])
      }
    }
  }
}
