// Stackra file contract:
// Purpose: the app delegate subscriber of the StackraSpotlight module: catches the user activity of an entry opened
//          from Spotlight and hands its link to the module, or keeps it until JavaScript asks when the app is starting.
// Boundary: handles only Core Spotlight's own activity type and lets every other activity through. Expo forwards a
//           scene's activities to app delegate subscribers, so it works with scene support on.
// Runtime: ios
// Governing contract: ADR 0478 (decisions 2 and 3: no hand-written code in the app).
import CoreSpotlight
import ExpoModulesCore

/// The link of the last opened entry and who hears the next one, behind a lock.
final class OpenedEntry: @unchecked Sendable {
  private let lock = NSLock()
  private var pending: String?
  private var listener: ((String) -> Void)?

  /// Hands `url` to the listener, or keeps it until `take`.
  func deliver(_ url: String) {
    lock.lock()
    let current = listener
    if current == nil { pending = url }
    lock.unlock()
    current?(url)
  }

  /// The kept link, once.
  func take() -> String? {
    lock.lock()
    defer { pending = nil; lock.unlock() }
    return pending
  }

  /// Sets or clears who hears the next link.
  func listen(_ next: ((String) -> Void)?) {
    lock.lock()
    listener = next
    lock.unlock()
  }
}

public final class StackraSpotlightAppDelegateSubscriber: ExpoAppDelegateSubscriber {
  /// Shared with the module, which may load after the activity arrives.
  static let opened = OpenedEntry()

  public func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    guard userActivity.activityType == CSSearchableItemActionType,
      let url = userActivity.userInfo?[CSSearchableItemActivityIdentifier] as? String
    else { return false }
    Self.opened.deliver(url)
    return true
  }
}
