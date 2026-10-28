// Stackra file contract:
// Purpose: ConnectionTokenRelay, Stripe Terminal's ConnectionTokenProvider for the module: each fetch the SDK makes
//          becomes an `onConnectionTokenRequest` event with a request id, and the JavaScript answer (a token from the
//          server, or a failure) completes it.
// Boundary: holds no token beyond the one in flight and never stores or reuses one; the server mints each token over
//           the tenant's Stripe Connection (ADR 0479 decision 4). Certification pending (STA-739).
// Runtime: ios
// Governing contract: ADR 0479 (decision 4); ADR 0478 (decision 5).
import Foundation
import StripeTerminal

final class ConnectionTokenRelay: NSObject, ConnectionTokenProvider {
  /// Sends the token request to JavaScript.
  private let request: (String) -> Void
  /// The SDK completions waiting for an answer, by request id.
  private var pending: [String: ConnectionTokenCompletionBlock] = [:]
  private let lock = NSLock()

  init(request: @escaping (String) -> Void) {
    self.request = request
  }

  func fetchConnectionToken(_ completion: @escaping ConnectionTokenCompletionBlock) {
    let requestId = UUID().uuidString
    lock.lock()
    pending[requestId] = completion
    lock.unlock()
    request(requestId)
  }

  /// Completes the request with the server's token.
  func resolve(_ requestId: String, token: String) {
    take(requestId)?(token, nil)
  }

  /// Completes the request with a failure.
  func reject(_ requestId: String, message: String) {
    let error = NSError(
      domain: "StackraCardTerminal", code: 1, userInfo: [NSLocalizedDescriptionKey: message])
    take(requestId)?(nil, error)
  }

  private func take(_ requestId: String) -> ConnectionTokenCompletionBlock? {
    lock.lock()
    defer { lock.unlock() }
    return pending.removeValue(forKey: requestId)
  }
}
