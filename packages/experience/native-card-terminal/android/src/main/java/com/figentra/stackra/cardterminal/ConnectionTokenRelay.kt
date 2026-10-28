// Stackra file contract:
// Purpose: ConnectionTokenRelay, Stripe Terminal's ConnectionTokenProvider for the module: each fetch the SDK makes
//          becomes an `onConnectionTokenRequest` event with a request id, and the JavaScript answer (a token from the
//          server, or a failure) completes it.
// Boundary: holds no token beyond the one in flight and never stores or reuses one; the server mints each token over
//           the tenant's Stripe Connection (ADR 0479 decision 4). Certification pending (STA-739).
// Runtime: android
// Governing contract: ADR 0479 (decision 4); ADR 0478 (decision 5).
package com.figentra.stackra.cardterminal

import com.stripe.stripeterminal.external.callable.ConnectionTokenCallback
import com.stripe.stripeterminal.external.callable.ConnectionTokenProvider
import com.stripe.stripeterminal.external.models.ConnectionTokenException
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap

class ConnectionTokenRelay(private val request: (String) -> Unit) : ConnectionTokenProvider {
  private val pending = ConcurrentHashMap<String, ConnectionTokenCallback>()

  override fun fetchConnectionToken(callback: ConnectionTokenCallback) {
    val requestId = UUID.randomUUID().toString()
    pending[requestId] = callback
    request(requestId)
  }

  /** Completes the request with the server's token. */
  fun resolve(requestId: String, token: String) {
    pending.remove(requestId)?.onSuccess(token)
  }

  /** Completes the request with a failure. */
  fun reject(requestId: String, message: String) {
    pending.remove(requestId)?.onFailure(ConnectionTokenException(message))
  }
}
