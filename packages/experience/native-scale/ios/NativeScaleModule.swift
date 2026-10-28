// Stackra file contract:
// Purpose: `NativeScaleModule`, the iOS side of the `StackraNativeScale` Expo module: `connect` opens one Bluetooth LE
//          serial link (`BleSerialLink`), `disconnect` closes it, `isConnected` answers, `write` sends a command as
//          Latin-1 text, and the `onData` event carries each chunk the scale sends.
// Boundary: a pass-through (ADR 0478 decision 5): no framing, parsing or mapping, which stay in the TypeScript
//           drivers. iOS reaches no USB serial or Bluetooth Classic SPP device without an MFi accessory, so `spp` and
//           `usb` reject with `E_UNAVAILABLE`. Checked on the box and on certified models (STA-739), never on a
//           developer Mac.
// Runtime: iOS
// Governing contract: ADR 0478 (decisions 2, 4 and 5).
import ExpoModulesCore

public class NativeScaleModule: Module {
  private var link: BleSerialLink?

  public func definition() -> ModuleDefinition {
    Name("StackraNativeScale")

    Events("onData")

    AsyncFunction("connect") { (record: ScaleLinkRecord, promise: Promise) in
      self.link?.close()
      self.link = nil
      guard record.transport == "ble" else {
        return promise.reject(
          ScaleLinkError.unavailable("iOS reaches scales over Bluetooth LE only.").exception)
      }
      let link = BleSerialLink(link: record) { [weak self] text in
        self?.sendEvent("onData", ["text": text])
      }
      self.link = link
      link.open { error in
        if let error = error as? ScaleLinkError {
          self.link = nil
          promise.reject(error.exception)
        } else {
          promise.resolve(nil)
        }
      }
    }.runOnQueue(.main)

    AsyncFunction("disconnect") {
      self.link?.close()
      self.link = nil
    }.runOnQueue(.main)

    AsyncFunction("isConnected") { () -> Bool in
      self.link?.isOpen ?? false
    }.runOnQueue(.main)

    AsyncFunction("write") { (text: String, promise: Promise) in
      do {
        guard let link = self.link else {
          throw ScaleLinkError.unavailable("The scale link is not open.")
        }
        try link.write(text)
        promise.resolve(nil)
      } catch let error as ScaleLinkError {
        promise.reject(error.exception)
      } catch {
        promise.reject(ScaleLinkError.unavailable(error.localizedDescription).exception)
      }
    }.runOnQueue(.main)

    OnDestroy {
      self.link?.close()
    }
  }
}
