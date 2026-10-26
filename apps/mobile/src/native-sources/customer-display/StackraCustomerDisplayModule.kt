// Stackra file contract:
// Purpose: the Android half of the `StackraCustomerDisplay` Expo module: draws the till's customer display view (basket
//          lines, total, message) on the display plugged into the tablet, as an Android `Presentation`.
// Boundary: native drawing only, from the view JSON `ExternalCustomerDisplayDriver` (@stackra/peripherals) sends. It
//           decides nothing; colours follow the system dark mode. Gen wires the module around this file (ADR 0345
//           decisions 6 and 7).
// Runtime: android
// Governing contract: ADR 0430 (decision 1); ADR 0339 (open question 3); ADR 0345 (decision 6).
package com.figentra.stackra.customerdisplay

import android.app.Presentation
import android.content.Context
import android.graphics.Typeface
import android.hardware.display.DisplayManager
import android.os.Bundle
import android.view.Display
import android.view.Gravity
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import org.json.JSONObject

/** The customer display on the external screen. */
class StackraCustomerDisplayModule : Module() {
  /** The presentation on the external display, while one is open. */
  private var presentation: CustomerPresentation? = null

  override fun definition() = ModuleDefinition {
    Name("StackraCustomerDisplay")

    AsyncFunction("isAvailable") { -> externalDisplay() != null }.runOnQueue(Queues.MAIN)

    AsyncFunction("show") { view: String -> present().render(JSONObject(view)) }.runOnQueue(Queues.MAIN)

    AsyncFunction("clear") { -> present().render(null) }.runOnQueue(Queues.MAIN)

    OnDestroy { presentation?.dismiss() }
  }

  /** The first display Android offers for presentations, or null when none is connected. */
  private fun externalDisplay(): Display? {
    val context = appContext.reactContext ?: return null
    val manager = context.getSystemService(Context.DISPLAY_SERVICE) as DisplayManager
    return manager.getDisplays(DisplayManager.DISPLAY_CATEGORY_PRESENTATION).firstOrNull()
  }

  /** The open presentation, opened on the external display when there is none or its display changed. */
  private fun present(): CustomerPresentation {
    val display = externalDisplay() ?: throw IllegalStateException("No external display is connected")
    val current = presentation
    if (current != null && current.isShowing && current.display.displayId == display.displayId) return current
    current?.dismiss()
    val activity = appContext.currentActivity ?: throw IllegalStateException("The app has no activity")
    return CustomerPresentation(activity, display).also {
      it.show()
      presentation = it
    }
  }
}

/** The presentation that draws one view: the lines, the total and the message, or the idle screen. */
class CustomerPresentation(context: Context, display: Display) : Presentation(context, display) {
  /** The column the view is drawn in. */
  private lateinit var column: LinearLayout

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    column = LinearLayout(context).apply {
      orientation = LinearLayout.VERTICAL
      setPadding(64, 48, 64, 48)
    }
    setContentView(ScrollView(context).apply { addView(column) })
    render(null)
  }

  /** Draws `view`, or the idle screen when it is null. */
  fun render(view: JSONObject?) {
    column.removeAllViews()
    if (view == null) return
    val lines = view.optJSONArray("lines")
    for (index in 0 until (lines?.length() ?: 0)) {
      val line = lines!!.getJSONObject(index)
      column.addView(row(line.optString("label"), line.optString("amount"), bold = false))
    }
    if (!view.isNull("total")) column.addView(row("", view.optString("total"), bold = true))
    if (!view.isNull("message"))
      column.addView(text(view.optString("message"), 28f, bold = false).apply { gravity = Gravity.CENTER })
  }

  /** One label and amount on a line, the amount at the end. */
  private fun row(label: String, amount: String, bold: Boolean) =
    LinearLayout(context).apply {
      orientation = LinearLayout.HORIZONTAL
      addView(text(label, 32f, bold), LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f))
      addView(text(amount, 32f, bold).apply { textAlignment = TextView.TEXT_ALIGNMENT_VIEW_END })
    }

  /** A text in the system text colour. */
  private fun text(value: String, size: Float, bold: Boolean) =
    TextView(context).apply {
      text = value
      textSize = size
      if (bold) setTypeface(typeface, Typeface.BOLD)
    }
}
