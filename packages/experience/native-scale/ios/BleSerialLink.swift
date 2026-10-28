// Stackra file contract:
// Purpose: `BleSerialLink`, a Bluetooth LE serial link to one scale through CoreBluetooth: it finds the peripheral by
//          identifier (or by advertised name while scanning for the serial service), subscribes to the notify
//          characteristic, hands every notification on as Latin-1 text, and writes commands to the write
//          characteristic.
// Boundary: a byte pipe only: no framing, parsing or mapping (ADR 0478 decision 5). Fails with `E_PERMISSION` when
//           Bluetooth is not allowed and `E_UNAVAILABLE` when it is off, the scale is not found within 10 seconds or
//           the service is missing. One link at a time; `close` cancels it.
// Runtime: iOS
// Governing contract: ADR 0478 (decisions 2 and 5).
import CoreBluetooth
import Foundation

final class BleSerialLink: NSObject, CBCentralManagerDelegate, CBPeripheralDelegate {
  private let link: ScaleLinkRecord
  private let onText: (String) -> Void
  private var central: CBCentralManager?
  private var peripheral: CBPeripheral?
  private var writeCharacteristic: CBCharacteristic?
  private var opened: ((Error?) -> Void)?
  private var timeout: DispatchWorkItem?

  private(set) var isOpen = false

  init(link: ScaleLinkRecord, onText: @escaping (String) -> Void) {
    self.link = link
    self.onText = onText
    super.init()
  }

  func open(_ completion: @escaping (Error?) -> Void) {
    opened = completion
    let work = DispatchWorkItem { [weak self] in
      self?.finish(ScaleLinkError.unavailable("No scale answered at \(self?.link.address ?? "")."))
    }
    timeout = work
    DispatchQueue.main.asyncAfter(deadline: .now() + 10, execute: work)
    central = CBCentralManager(delegate: self, queue: .main)
  }

  func write(_ text: String) throws {
    guard isOpen, let peripheral, let characteristic = writeCharacteristic,
      let data = text.data(using: .isoLatin1)
    else { throw ScaleLinkError.unavailable("The scale link is not open.") }
    let type: CBCharacteristicWriteType =
      characteristic.properties.contains(.writeWithoutResponse) ? .withoutResponse : .withResponse
    peripheral.writeValue(data, for: characteristic, type: type)
  }

  func close() {
    timeout?.cancel()
    central?.stopScan()
    if let peripheral { central?.cancelPeripheralConnection(peripheral) }
    isOpen = false
    peripheral = nil
    writeCharacteristic = nil
    central = nil
  }

  private func finish(_ error: Error?) {
    timeout?.cancel()
    guard let done = opened else { return }
    opened = nil
    if error != nil { close() } else { isOpen = true }
    done(error)
  }

  func centralManagerDidUpdateState(_ central: CBCentralManager) {
    switch central.state {
    case .poweredOn:
      let service = CBUUID(string: link.bleService)
      if let id = UUID(uuidString: link.address),
        let known = central.retrievePeripherals(withIdentifiers: [id]).first
      {
        connect(known)
      } else {
        central.scanForPeripherals(withServices: [service])
      }
    case .unauthorized:
      finish(ScaleLinkError.permission("Bluetooth is not allowed for this app."))
    case .poweredOff, .unsupported:
      finish(ScaleLinkError.unavailable("Bluetooth is off or not supported."))
    default:
      break
    }
  }

  func centralManager(
    _ central: CBCentralManager, didDiscover peripheral: CBPeripheral,
    advertisementData: [String: Any], rssi RSSI: NSNumber
  ) {
    let name = advertisementData[CBAdvertisementDataLocalNameKey] as? String ?? peripheral.name
    guard peripheral.identifier.uuidString.caseInsensitiveCompare(link.address) == .orderedSame
      || name == link.address
    else { return }
    central.stopScan()
    connect(peripheral)
  }

  private func connect(_ target: CBPeripheral) {
    peripheral = target
    target.delegate = self
    central?.connect(target)
  }

  func centralManager(_ central: CBCentralManager, didConnect peripheral: CBPeripheral) {
    peripheral.discoverServices([CBUUID(string: link.bleService)])
  }

  func centralManager(
    _ central: CBCentralManager, didFailToConnect peripheral: CBPeripheral, error: Error?
  ) {
    finish(ScaleLinkError.unavailable(error?.localizedDescription ?? "The scale refused the link."))
  }

  func centralManager(
    _ central: CBCentralManager, didDisconnectPeripheral peripheral: CBPeripheral, error: Error?
  ) {
    isOpen = false
    writeCharacteristic = nil
  }

  func peripheral(_ peripheral: CBPeripheral, didDiscoverServices error: Error?) {
    guard let service = peripheral.services?.first(where: { $0.uuid == CBUUID(string: link.bleService) })
    else { return finish(ScaleLinkError.unavailable("The scale has no serial service.")) }
    peripheral.discoverCharacteristics(
      [CBUUID(string: link.bleNotify), CBUUID(string: link.bleWrite)], for: service)
  }

  func peripheral(
    _ peripheral: CBPeripheral, didDiscoverCharacteristicsFor service: CBService, error: Error?
  ) {
    let characteristics = service.characteristics ?? []
    guard let notify = characteristics.first(where: { $0.uuid == CBUUID(string: link.bleNotify) }),
      let write = characteristics.first(where: { $0.uuid == CBUUID(string: link.bleWrite) })
    else { return finish(ScaleLinkError.unavailable("The scale has no serial characteristics.")) }
    writeCharacteristic = write
    peripheral.setNotifyValue(true, for: notify)
  }

  func peripheral(
    _ peripheral: CBPeripheral, didUpdateNotificationStateFor characteristic: CBCharacteristic,
    error: Error?
  ) {
    if let error { return finish(ScaleLinkError.unavailable(error.localizedDescription)) }
    finish(nil)
  }

  func peripheral(
    _ peripheral: CBPeripheral, didUpdateValueFor characteristic: CBCharacteristic, error: Error?
  ) {
    guard error == nil, let data = characteristic.value,
      let text = String(data: data, encoding: .isoLatin1)
    else { return }
    onText(text)
  }
}
