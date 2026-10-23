/**
 * Stackra file contract:
 * Purpose: the Expo entry point; registers the root component and loads the global stylesheet. A stand-in for the
 *          native entry gen writes (ADR 0295 decision 7).
 * Boundary: registration only; it declares no screen and no navigator.
 * Runtime: react-native
 * Governing contract: ADR 0295 (decision 7); ADR 0294 (rule R12).
 */
import "./styles/global.css";

import { registerRootComponent } from "expo";

import { App } from "./app";

// shortcut: authored until stackra gen writes `.stackra/entry/native.ts` (STA-339); then delete this file, app.tsx
// and navigation/, and point package.json `main` at the generated entry.
registerRootComponent(App);
