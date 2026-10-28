// Stackra file contract:
// Purpose: `BluetoothPermissions.require`, which throws `E_PERMISSION` when the app lacks the Bluetooth runtime
//          permission a link needs (`BLUETOOTH_CONNECT` on Android 12 and later, `ACCESS_FINE_LOCATION` before it for
//          a BLE scan), and `E_UNAVAILABLE` when the device has no Bluetooth or it is off.
// Boundary: checks only; asking is the app's permission flow. The permissions are declared by the config plugin.
// Runtime: Android
// Governing contract: ADR 0478 (decisions 2 and 5).
package com.figentra.stackra.nativescale

import android.Manifest
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothManager
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.content.ContextCompat

object BluetoothPermissions {
  fun require(context: Context): BluetoothAdapter {
    val needed =
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) Manifest.permission.BLUETOOTH_CONNECT
      else Manifest.permission.ACCESS_FINE_LOCATION
    if (ContextCompat.checkSelfPermission(context, needed) != PackageManager.PERMISSION_GRANTED)
      throw ScaleLinkException.permission("$needed is not granted.")
    val manager = context.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager?
    val adapter = manager?.adapter ?: throw ScaleLinkException.unavailable("This device has no Bluetooth.")
    if (!adapter.isEnabled) throw ScaleLinkException.unavailable("Bluetooth is off.")
    return adapter
  }
}
