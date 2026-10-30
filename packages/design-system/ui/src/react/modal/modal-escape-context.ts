/**
 * Stackra file contract:
 * Purpose: `ModalEscapeContext`, whether Escape closes the modal around a `Modal.Close`, so a modal whose Escape is
 *          turned off draws its close mark instead of an "esc" key cap that would promise what the key cannot do.
 * Boundary: the context object only; outside a Modal, Escape is taken to close it.
 * Runtime: browser
 * Governing contract: STA-1371 (drawer and modal close control, 2026-10-29); WCAG 2.2 SC 2.5.3.
 */
import { createContext } from "react";

/** Whether Escape closes the enclosing modal. */
export const ModalEscapeContext = createContext(true);
