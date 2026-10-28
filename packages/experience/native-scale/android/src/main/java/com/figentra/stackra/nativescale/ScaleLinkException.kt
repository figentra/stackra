// Stackra file contract:
// Purpose: `ScaleLinkException`, why a link did not open or a write failed, with the code the TypeScript driver maps
//          to a refusal: `E_PERMISSION` (a Bluetooth or USB permission is missing) or `E_UNAVAILABLE` (anything else).
// Boundary: the two codes equal those `NativeScaleModule.connect` documents; the message is for logs only.
// Runtime: Android
// Governing contract: ADR 0478 (decision 5); ADR 0250 (decision 3).
package com.figentra.stackra.nativescale

import expo.modules.kotlin.exception.CodedException

class ScaleLinkException(code: String, message: String, cause: Throwable? = null) :
  CodedException(code, message, cause) {
  companion object {
    const val PERMISSION = "E_PERMISSION"
    const val UNAVAILABLE = "E_UNAVAILABLE"

    fun permission(message: String) = ScaleLinkException(PERMISSION, message)

    fun unavailable(message: String, cause: Throwable? = null) =
      ScaleLinkException(UNAVAILABLE, message, cause)
  }
}
