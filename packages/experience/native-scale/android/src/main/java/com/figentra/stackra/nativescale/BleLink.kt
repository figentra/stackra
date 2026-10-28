// Stackra file contract:
// Purpose: `BleLink`, a Bluetooth LE serial link to a scale by MAC address: GATT connect, discover the configured
//          serial service, enable notifications on the notify characteristic (through its CCC descriptor), hand
//          each notification on as Latin-1 text, and write commands to the write characteristic.
// Boundary: a pipe only (ADR 0478 decision 5). `open` blocks up to 10 seconds; no answer, a missing service or
//           characteristic fail with `E_UNAVAILABLE`, a missing permission with `E_PERMISSION`. Writes larger than
//           the default 20-byte payload are split.
// Runtime: Android
// Governing contract: ADR 0478 (decisions 2 and 5).
package com.figentra.stackra.nativescale

import android.annotation.SuppressLint
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothGatt
import android.bluetooth.BluetoothGattCallback
import android.bluetooth.BluetoothGattCharacteristic
import android.bluetooth.BluetoothGattDescriptor
import android.bluetooth.BluetoothProfile
import android.content.Context
import java.util.UUID
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

@SuppressLint("MissingPermission")
class BleLink(
  private val context: Context,
  private val record: ScaleLinkRecord,
  private val onText: (String) -> Unit,
) : ScaleLinkTransport {
  private var gatt: BluetoothGatt? = null
  private var writeCharacteristic: BluetoothGattCharacteristic? = null
  private var ready = CountDownLatch(1)
  private var failure: ScaleLinkException? = null

  @Volatile
  private var connected = false

  override val isOpen: Boolean
    get() = connected && writeCharacteristic != null

  private val callback = object : BluetoothGattCallback() {
    override fun onConnectionStateChange(gatt: BluetoothGatt, status: Int, newState: Int) {
      if (newState == BluetoothProfile.STATE_CONNECTED) {
        connected = true
        gatt.discoverServices()
      } else {
        connected = false
        fail("The scale disconnected.")
      }
    }

    override fun onServicesDiscovered(gatt: BluetoothGatt, status: Int) {
      val service = gatt.getService(UUID.fromString(record.bleService))
        ?: return fail("The scale has no serial service.")
      val notify = service.getCharacteristic(UUID.fromString(record.bleNotify))
      val write = service.getCharacteristic(UUID.fromString(record.bleWrite))
      if (notify == null || write == null) return fail("The scale has no serial characteristics.")
      writeCharacteristic = write
      gatt.setCharacteristicNotification(notify, true)
      val descriptor = notify.getDescriptor(CCC)
      if (descriptor == null) {
        ready.countDown()
        return
      }
      @Suppress("DEPRECATION")
      descriptor.value = BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE
      @Suppress("DEPRECATION")
      gatt.writeDescriptor(descriptor)
    }

    override fun onDescriptorWrite(gatt: BluetoothGatt, descriptor: BluetoothGattDescriptor, status: Int) {
      if (status == BluetoothGatt.GATT_SUCCESS) ready.countDown() else fail("Notifications were refused.")
    }

    @Deprecated("Kept for Android 12 and earlier")
    override fun onCharacteristicChanged(gatt: BluetoothGatt, characteristic: BluetoothGattCharacteristic) {
      @Suppress("DEPRECATION")
      characteristic.value?.let { onText(String(it, Charsets.ISO_8859_1)) }
    }

    override fun onCharacteristicChanged(
      gatt: BluetoothGatt,
      characteristic: BluetoothGattCharacteristic,
      value: ByteArray,
    ) {
      onText(String(value, Charsets.ISO_8859_1))
    }
  }

  private fun fail(message: String) {
    if (ready.count > 0) {
      failure = ScaleLinkException.unavailable(message)
      ready.countDown()
    }
  }

  override fun open() {
    val adapter = BluetoothPermissions.require(context)
    if (!android.bluetooth.BluetoothAdapter.checkBluetoothAddress(record.address.uppercase()))
      throw ScaleLinkException.unavailable("${record.address} is not a Bluetooth address.")
    ready = CountDownLatch(1)
    failure = null
    val device = adapter.getRemoteDevice(record.address.uppercase())
    try {
      gatt = device.connectGatt(context, false, callback, BluetoothDevice.TRANSPORT_LE)
    } catch (error: SecurityException) {
      throw ScaleLinkException.permission(error.message ?: "Bluetooth is not allowed.")
    }
    if (!ready.await(10, TimeUnit.SECONDS)) failure = ScaleLinkException.unavailable("No scale answered.")
    failure?.let {
      close()
      throw it
    }
  }

  override fun write(text: String) {
    val target = gatt
    val characteristic = writeCharacteristic
    if (target == null || characteristic == null) throw ScaleLinkException.unavailable("The scale link is not open.")
    for (chunk in text.toByteArray(Charsets.ISO_8859_1).toList().chunked(20)) {
      @Suppress("DEPRECATION")
      characteristic.value = chunk.toByteArray()
      @Suppress("DEPRECATION")
      if (!target.writeCharacteristic(characteristic)) throw ScaleLinkException.unavailable("The write failed.")
    }
  }

  override fun close() {
    connected = false
    writeCharacteristic = null
    gatt?.disconnect()
    gatt?.close()
    gatt = null
  }

  private companion object {
    val CCC: UUID = UUID.fromString("00002902-0000-1000-8000-00805f9b34fb")
  }
}
