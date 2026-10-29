// Stackra file contract:
// Purpose: the StackraSpotlight Expo module on iOS: indexes, removes and clears this app's Core Spotlight entries and
//          reports the entry the person opened from Spotlight.
// Boundary: a pass-through; the TypeScript driver decides what to index. The index is created with complete file
//           protection, so its entries are searchable only while the phone is unlocked. An entry's link is its
//           unique identifier and its record kind the domain identifier.
// Runtime: ios
// Governing contract: ADR 0478 (decisions 2 and 5).
import CoreSpotlight
import ExpoModulesCore
import UniformTypeIdentifiers

/// One entry as JavaScript hands it over.
struct SpotlightItem: Record {
  @Field var url: String = ""
  @Field var kind: String = ""
  @Field var title: String = ""
  @Field var details: String?
  @Field var keywords: [String] = []
}

public final class StackraSpotlightModule: Module {
  /// This app's own index, readable only while the phone is unlocked.
  private lazy var index = CSSearchableIndex(name: "stackra", protectionClass: .complete)

  public func definition() -> ModuleDefinition {
    Name("StackraSpotlight")

    Events("onOpen")

    Function("isAvailable") {
      CSSearchableIndex.isIndexingAvailable()
    }

    AsyncFunction("index") { (items: [SpotlightItem]) in
      let entries = items.map { item -> CSSearchableItem in
        let attributes = CSSearchableItemAttributeSet(contentType: .content)
        attributes.title = item.title
        attributes.contentDescription = item.details
        attributes.keywords = item.keywords
        return CSSearchableItem(uniqueIdentifier: item.url, domainIdentifier: item.kind, attributeSet: attributes)
      }
      try await self.index.indexSearchableItems(entries)
    }

    AsyncFunction("remove") { (urls: [String]) in
      try await self.index.deleteSearchableItems(withIdentifiers: urls)
    }

    AsyncFunction("removeAll") {
      try await self.index.deleteAllSearchableItems()
    }

    Function("takeOpened") { () -> String? in
      StackraSpotlightAppDelegateSubscriber.opened.take()
    }

    OnStartObserving {
      StackraSpotlightAppDelegateSubscriber.opened.listen { [weak self] url in
        self?.sendEvent("onOpen", ["url": url])
      }
    }

    OnStopObserving {
      StackraSpotlightAppDelegateSubscriber.opened.listen(nil)
    }
  }
}
