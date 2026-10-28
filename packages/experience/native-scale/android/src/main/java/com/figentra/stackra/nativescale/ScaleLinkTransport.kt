// Stackra file contract:
// Purpose: `ScaleLinkTransport`, one open byte link to a scale (Bluetooth LE, Bluetooth SPP or USB serial): open it
//          (blocking, off the main thread), write text, close it, and whether it is open. Received bytes go to the
//          `onText` callback each transport takes, as Latin-1 text.
// Boundary: a pipe only: no framing, parsing or mapping (ADR 0478 decision 5).
// Runtime: Android
// Governing contract: ADR 0478 (decision 5).
package com.figentra.stackra.nativescale

interface ScaleLinkTransport {
  val isOpen: Boolean

  /** Opens the link or throws a ScaleLinkException. */
  fun open()

  /** Writes the text as Latin-1 bytes or throws a ScaleLinkException. */
  fun write(text: String)

  /** Closes the link; safe to call twice. */
  fun close()
}
