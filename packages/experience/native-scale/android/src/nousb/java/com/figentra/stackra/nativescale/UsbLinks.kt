// Stackra file contract:
// Purpose: `UsbLinks.create`, the USB serial link factory compiled when the app does not keep `usb`: it refuses with
//          `E_UNAVAILABLE`, so the USB serial library is left out of the app (ADR 0478 decision 2).
// Boundary: one of two source sets of the same name; `src/usb` holds the real one (android/build.gradle).
// Runtime: Android
// Governing contract: ADR 0478 (decisions 2 and 4).
package com.figentra.stackra.nativescale

import android.content.Context

object UsbLinks {
  @Suppress("UNUSED_PARAMETER")
  fun create(context: Context, record: ScaleLinkRecord, onText: (String) -> Unit): ScaleLinkTransport =
    throw ScaleLinkException.unavailable("This app is built without the USB serial transport.")
}
