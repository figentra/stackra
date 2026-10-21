/**
 * Stackra file contract:
 * Purpose: the Expo entry point; registers the root component and loads the global stylesheet.
 * Boundary: registration only; it declares no screen and no navigator.
 * Runtime: react-native
 * Governing contract: ADR 0007 (documentation).
 */
import "./global.css";

import { registerRootComponent } from "expo";

import { App } from "./app";

registerRootComponent(App);
