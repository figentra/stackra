// Stackra file contract:
// Purpose: `BluetoothPermissions.require`, which throws `E_PERMISSION` when the app lacks the Bluetooth runtime
//          permission a link needs (`BLUETOOTH_CONNECT` on Android 12 and later; before it, connecting to a known
//          address needs only the install-time `BLUETOOTH` and `BLUETOOTH_ADMIN`, so nothing is checked), and
//          `E_UNAVAILABLE` when the device has no Bluetooth or it is off.
// Boundary: checks only, never asks: the TypeScript drivers ask @stackra/platform's DevicePermissions for
//           `bluetooth` (scan and connect on Android 12 and later) before a link opens. The permissions are declared by
//           the config plugin.
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
    val needed = Manifest.permission.BLUETOOTH_CONNECT
    if (
      Build.VERSION.SDK_INT >= Build.VERSION_CODES.S &&
        ContextCompat.checkSelfPermission(context, needed) != PackageManager.PERMISSION_GRANTED
    )
      throw ScaleLinkException.permission("$needed is not granted.")
    val manager = context.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager?
    val adapter = manager?.adapter ?: throw ScaleLinkException.unavailable("This device has no Bluetooth.")
    if (!adapter.isEnabled) throw ScaleLinkException.unavailable("Bluetooth is off.")
    return adapter
  }
}
