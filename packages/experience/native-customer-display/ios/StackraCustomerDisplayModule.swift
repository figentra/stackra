// Stackra file contract:
// Purpose: the iOS half of the `StackraCustomerDisplay` Expo module: draws the till's customer display view (basket
//          lines, total, message) on the iPad's external display, in the scene iOS connects for it.
// Boundary: native drawing only, from the view JSON `ExternalCustomerDisplayDriver` (@stackra/native-customer-display)
//           sends. It needs the app's scene support (`enableSceneSupport` of expo-build-properties) for iOS to connect
//           the external-display scene; whether the current React Native line keeps that scene is the spike STA-475.
//           Moved from the mobile app's `src/native-sources/customer-display/` unchanged (ADR 0478, STA-1533).
// Runtime: ios
// Governing contract: ADR 0430 (decision 1); ADR 0339 (open question 3); ADR 0344 (open spike 1); ADR 0478 (decision 2).
import ExpoModulesCore
import SwiftUI
import UIKit

/** One basket line of the view. */
struct CustomerDisplayLine: Decodable, Hashable {
  let label: String
  let amount: String
}

/** The view the till sends. */
struct CustomerDisplayView: Decodable {
  let lines: [CustomerDisplayLine]
  let total: String?
  let message: String?
}

/** The view drawn: the lines, the total and the message, or nothing (the idle screen). */
struct CustomerDisplayScreen: View {
  let view: CustomerDisplayView?

  var body: some View {
    VStack(alignment: .leading, spacing: 16) {
      if let view {
        ForEach(view.lines, id: \.self) { line in
          HStack {
            Text(line.label)
            Spacer()
            Text(line.amount)
          }
          .font(.title)
        }
        if let total = view.total {
          HStack {
            Spacer()
            Text(total).font(.largeTitle.bold())
          }
        }
        if let message = view.message {
          Text(message).font(.title2).frame(maxWidth: .infinity)
        }
      }
      Spacer()
    }
    .padding(48)
  }
}

/** The customer display on the external screen. */
public class StackraCustomerDisplayModule: Module {
  /** The window on the external display, while one is open. */
  private var window: UIWindow?

  public func definition() -> ModuleDefinition {
    Name("StackraCustomerDisplay")

    AsyncFunction("isAvailable") { () -> Bool in
      self.externalScene() != nil
    }.runOnQueue(.main)

    AsyncFunction("show") { (json: String) in
      let view = try JSONDecoder().decode(CustomerDisplayView.self, from: Data(json.utf8))
      try self.render(view)
    }.runOnQueue(.main)

    AsyncFunction("clear") {
      try self.render(nil)
    }.runOnQueue(.main)
  }

  /** The scene iOS connected for the external display, or nil when none is plugged in. */
  private func externalScene() -> UIWindowScene? {
    UIApplication.shared.connectedScenes
      .compactMap { $0 as? UIWindowScene }
      .first { $0.session.role == .windowExternalDisplayNonInteractive }
  }

  /** Draws `view` in a window on the external scene, opening it when there is none or the scene changed. */
  private func render(_ view: CustomerDisplayView?) throws {
    guard let scene = externalScene() else {
      throw Exception(name: "NoExternalDisplay", description: "No external display is connected")
    }
    let content = UIHostingController(rootView: CustomerDisplayScreen(view: view))
    if let window, window.windowScene === scene {
      window.rootViewController = content
      return
    }
    let opened = UIWindow(windowScene: scene)
    opened.rootViewController = content
    opened.isHidden = false
    window = opened
  }
}
