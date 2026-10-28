// Stackra file contract:
// Purpose: `UsbLinks.create`, the USB serial link factory compiled when the app keeps `usb`: it answers a `UsbLink`.
// Boundary: one of two source sets of the same name; `src/nousb` holds the refusing one (android/build.gradle).
// Runtime: Android
// Governing contract: ADR 0478 (decisions 2 and 4).
package com.figentra.stackra.nativescale

import android.content.Context

object UsbLinks {
  fun create(context: Context, record: ScaleLinkRecord, onText: (String) -> Unit): ScaleLinkTransport =
    UsbLink(context, record, onText)
}
