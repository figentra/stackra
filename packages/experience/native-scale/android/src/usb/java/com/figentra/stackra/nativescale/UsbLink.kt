// Stackra file contract:
// Purpose: `UsbLink`, a USB serial link to a scale through usb-serial-for-android (FTDI, CP210x, CH34x, PL2303,
//          CDC-ACM adapters): it finds the adapter by `<vendorId>:<productId>` in hex (or the first one when the
//          address is `any`), asks for the USB permission when it is missing, opens the port at the configured baud
//          rate, 8 data bits, 1 stop bit, no parity, and hands each received chunk on as Latin-1 text.
// Boundary: a pipe only (ADR 0478 decision 5). A missing USB permission fails with `E_PERMISSION` after asking, so
//           the next connect succeeds once the person allowed it; no adapter fails with `E_UNAVAILABLE`.
// Runtime: Android
// Governing contract: ADR 0478 (decisions 2, 4 and 5).
package com.figentra.stackra.nativescale

import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.hardware.usb.UsbManager
import android.os.Build
import com.hoho.android.usbserial.driver.UsbSerialPort
import com.hoho.android.usbserial.driver.UsbSerialProber
import com.hoho.android.usbserial.util.SerialInputOutputManager
import java.io.IOException

class UsbLink(
  private val context: Context,
  private val record: ScaleLinkRecord,
  private val onText: (String) -> Unit,
) : ScaleLinkTransport {
  private var port: UsbSerialPort? = null
  private var io: SerialInputOutputManager? = null

  override val isOpen: Boolean
    get() = port?.isOpen == true

  override fun open() {
    val manager = context.getSystemService(Context.USB_SERVICE) as UsbManager
    val drivers = UsbSerialProber.getDefaultProber().findAllDrivers(manager)
    val driver = drivers.firstOrNull { matches(it.device.vendorId, it.device.productId) }
      ?: throw ScaleLinkException.unavailable("No USB serial adapter matches ${record.address}.")
    if (!manager.hasPermission(driver.device)) {
      val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) PendingIntent.FLAG_MUTABLE else 0
      val intent = Intent(PERMISSION_ACTION).setPackage(context.packageName)
      manager.requestPermission(driver.device, PendingIntent.getBroadcast(context, 0, intent, flags))
      throw ScaleLinkException.permission("USB access to the scale adapter is not granted yet.")
    }
    val connection = manager.openDevice(driver.device)
      ?: throw ScaleLinkException.unavailable("The USB adapter could not be opened.")
    val opened = driver.ports.firstOrNull() ?: throw ScaleLinkException.unavailable("The adapter has no port.")
    try {
      opened.open(connection)
      opened.setParameters(record.baudRate, 8, UsbSerialPort.STOPBITS_1, UsbSerialPort.PARITY_NONE)
    } catch (error: IOException) {
      throw ScaleLinkException.unavailable("The USB port could not be set up.", error)
    }
    port = opened
    io = SerialInputOutputManager(opened, object : SerialInputOutputManager.Listener {
      override fun onNewData(data: ByteArray) {
        onText(String(data, Charsets.ISO_8859_1))
      }

      override fun onRunError(error: Exception) {
        close()
      }
    }).also { it.start() }
  }

  override fun write(text: String) {
    val open = port ?: throw ScaleLinkException.unavailable("The scale link is not open.")
    try {
      open.write(text.toByteArray(Charsets.ISO_8859_1), WRITE_TIMEOUT)
    } catch (error: IOException) {
      throw ScaleLinkException.unavailable("The write failed.", error)
    }
  }

  override fun close() {
    io?.stop()
    io = null
    try {
      port?.close()
    } catch (_: IOException) {
      // Already closed.
    }
    port = null
  }

  private fun matches(vendorId: Int, productId: Int): Boolean {
    if (record.address == "any") return true
    val parts = record.address.lowercase().split(":")
    if (parts.size != 2) return false
    return parts[0].toIntOrNull(16) == vendorId && parts[1].toIntOrNull(16) == productId
  }

  private companion object {
    const val PERMISSION_ACTION = "com.figentra.stackra.nativescale.USB_PERMISSION"
    const val WRITE_TIMEOUT = 1000
  }
}
