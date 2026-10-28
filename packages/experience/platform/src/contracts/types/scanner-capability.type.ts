/**
 * Stackra file contract:
 * Purpose: `ScannerCapability`, the `scanner` facet: whether this device has a usable camera now, its permission, a
 *          way to ask for it, and the camera view component that decodes barcodes (`ScannerView` renders it).
 * Boundary: a type only. The view is the driver's component, so a page never imports a camera module; offering the
 *           port (`platform.has(PlatformCapability.Scanner)`) and having a camera now (`isAvailable`) are separate: a
 *           simulator offers the port and has no camera.
 * Runtime: isomorphic
 * Governing contract: ADR 0250 (decision 2); ADR 0253.
 */
import type { ComponentType } from "react";

import type { PermissionStatus } from "#contracts/types/permission-status.type";
import type { ScannerViewProps } from "#contracts/types/scanner-view-props.type";

/** The barcode scanner. */
export interface ScannerCapability {
  /** True when a camera can scan on this device now. */
  readonly isAvailable: boolean;

  /** Where the camera permission stands now. */
  readonly permission: PermissionStatus;

  /** Asks for the camera permission; resolves where it stands afterwards. */
  requestPermission: () => Promise<PermissionStatus>;

  /** The camera view that decodes barcodes. */
  readonly View: ComponentType<ScannerViewProps>;
}
