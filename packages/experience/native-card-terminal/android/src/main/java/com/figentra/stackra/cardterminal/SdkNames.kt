// Stackra file contract:
// Purpose: the shapes the module sends JavaScript for Stripe Terminal's answers: an error as its `TerminalErrorCode`
//          name and message, a reader as its serial number and `DeviceType` name. Kotlin prints enum names, so nothing
//          is translated.
// Boundary: naming only; never card data. Certification pending (STA-739).
// Runtime: android
// Governing contract: ADR 0479 (decision 1: the module maps nothing); ADR 0478 (decision 5).
package com.figentra.stackra.cardterminal

import com.stripe.stripeterminal.external.models.Reader
import com.stripe.stripeterminal.external.models.TerminalException

object SdkNames {
  fun error(error: TerminalException): Map<String, Any?> =
    mapOf("code" to error.errorCode.name, "message" to error.errorMessage)

  fun errorOf(code: String): Map<String, Any?> = mapOf("code" to code)

  fun reader(reader: Reader): Map<String, Any?> =
    mapOf("serialNumber" to (reader.serialNumber ?: ""), "deviceType" to reader.deviceType.name)
}
