// Stackra file contract:
// Purpose: ReaderEvents, the listeners the module hands Stripe Terminal for the terminal, Bluetooth readers and Tap to
//          Pay; it keeps nothing and lets the SDK's defaults handle updates and prompts (updates install on connect,
//          prompts show on the reader or the system screen).
// Boundary: forwards nothing to JavaScript; no card data. Certification pending (STA-739).
// Runtime: android
// Governing contract: ADR 0479 (decisions 1 and 2).
package com.figentra.stackra.cardterminal

import com.stripe.stripeterminal.external.callable.MobileReaderListener
import com.stripe.stripeterminal.external.callable.TapToPayReaderListener
import com.stripe.stripeterminal.external.callable.TerminalListener

object ReaderEvents : TerminalListener, MobileReaderListener, TapToPayReaderListener
