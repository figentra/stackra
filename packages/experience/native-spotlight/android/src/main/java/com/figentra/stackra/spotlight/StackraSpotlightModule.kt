// Stackra file contract:
// Purpose: the StackraSpotlight Expo module on Android: puts this app's entries in launcher search as dynamic
//          shortcuts that open their deep link, and removes them.
// Boundary: a pass-through; the TypeScript driver decides what to index. Only shortcuts this module made (marked by
//           an extra) are removed, so other dynamic shortcuts of the app stay. Android keeps at most the launcher's
//           per-activity limit, newest first; an opened entry is an ordinary VIEW intent the app's Linking receives,
//           so `takeOpened` is always null here and `onOpen` never fires.
// Runtime: android
// Governing contract: ADR 0478 (decisions 2 and 5).
package com.figentra.stackra.spotlight

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.PersistableBundle
import androidx.core.content.pm.ShortcutInfoCompat
import androidx.core.content.pm.ShortcutManagerCompat
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

/** The extra that marks a shortcut as one of this module's entries. */
private const val MARK = "stackra_spotlight"

/** The longest short label launchers show in full. */
private const val SHORT_LABEL = 25

/** One entry as JavaScript hands it over. */
class SpotlightItem : Record {
  @Field val url: String = ""
  @Field val kind: String = ""
  @Field val title: String = ""
  @Field val details: String? = null
  @Field val keywords: List<String> = emptyList()
}

class StackraSpotlightModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("StackraSpotlight")

    Events("onOpen")

    Function("isAvailable") { true }

    AsyncFunction("index") { items: List<SpotlightItem> ->
      val limit = ShortcutManagerCompat.getMaxShortcutCountPerActivity(context)
      items.take(limit).forEachIndexed { rank, item ->
        val shortcut = ShortcutInfoCompat.Builder(context, item.url)
          .setShortLabel(item.title.take(SHORT_LABEL))
          .setLongLabel(item.title)
          .setIntent(Intent(Intent.ACTION_VIEW, Uri.parse(item.url)).setPackage(context.packageName))
          .setRank(rank)
          .setExtras(PersistableBundle().apply { putBoolean(MARK, true) })
          .build()
        ShortcutManagerCompat.pushDynamicShortcut(context, shortcut)
      }
    }

    AsyncFunction("remove") { urls: List<String> ->
      ShortcutManagerCompat.removeDynamicShortcuts(context, urls)
    }

    AsyncFunction("removeAll") {
      val ours = ShortcutManagerCompat.getDynamicShortcuts(context)
        .filter { it.extras?.getBoolean(MARK) == true }
        .map { it.id }
      ShortcutManagerCompat.removeDynamicShortcuts(context, ours)
    }

    Function("takeOpened") { null as String? }
  }
}
