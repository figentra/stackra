// Stackra file contract:
// Purpose: `SppLink`, a Bluetooth Classic serial port profile link to a paired scale by MAC address: an RFCOMM socket
//          on the SPP UUID, a reader thread handing each received chunk on as Latin-1 text, and blocking writes.
// Boundary: a pipe only (ADR 0478 decision 5). The scale must be paired in Android settings; an unpaired or absent
//           scale fails with `E_UNAVAILABLE`, a missing permission with `E_PERMISSION`.
// Runtime: Android
// Governing contract: ADR 0478 (decisions 2 and 5).
package com.figentra.stackra.nativescale

import android.annotation.SuppressLint
import android.bluetooth.BluetoothSocket
import android.content.Context
import java.io.IOException
import java.util.UUID

class SppLink(
  private val context: Context,
  private val record: ScaleLinkRecord,
  private val onText: (String) -> Unit,
) : ScaleLinkTransport {
  private var socket: BluetoothSocket? = null
  private var reader: Thread? = null

  override val isOpen: Boolean
    get() = socket?.isConnected == true

  @SuppressLint("MissingPermission")
  override fun open() {
    val adapter = BluetoothPermissions.require(context)
    if (!android.bluetooth.BluetoothAdapter.checkBluetoothAddress(record.address.uppercase()))
      throw ScaleLinkException.unavailable("${record.address} is not a Bluetooth address.")
    val device = adapter.getRemoteDevice(record.address.uppercase())
    try {
      adapter.cancelDiscovery()
      val opened = device.createRfcommSocketToServiceRecord(SPP)
      opened.connect()
      socket = opened
    } catch (error: SecurityException) {
      throw ScaleLinkException.permission(error.message ?: "Bluetooth is not allowed.")
    } catch (error: IOException) {
      close()
      throw ScaleLinkException.unavailable("The scale did not answer.", error)
    }
    val input = socket!!.inputStream
    reader = Thread {
      val buffer = ByteArray(256)
      try {
        while (!Thread.currentThread().isInterrupted) {
          val count = input.read(buffer)
          if (count < 0) break
          if (count > 0) onText(String(buffer, 0, count, Charsets.ISO_8859_1))
        }
      } catch (_: IOException) {
        // The link closed; isOpen answers false from now on.
      }
    }.apply {
      name = "StackraNativeScale-spp"
      isDaemon = true
      start()
    }
  }

  override fun write(text: String) {
    val output = socket?.outputStream ?: throw ScaleLinkException.unavailable("The scale link is not open.")
    try {
      output.write(text.toByteArray(Charsets.ISO_8859_1))
      output.flush()
    } catch (error: IOException) {
      throw ScaleLinkException.unavailable("The write failed.", error)
    }
  }

  override fun close() {
    reader?.interrupt()
    reader = null
    try {
      socket?.close()
    } catch (_: IOException) {
      // Already closed.
    }
    socket = null
  }

  private companion object {
    val SPP: UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB")
  }
}
