/**
 * Stackra file contract:
 * Purpose: `SmokePreviewRequest`, what the smoke step after a preview deploy runs from: the repository, the environment
 *          whose hosts it opens, the driver of each target, and the mobile builds with their template checkout.
 * Boundary: type only; `smokePreview` takes it.
 * Runtime: node
 * Governing contract: STA-265 spec (D6, FR-009).
 */
import type { RunwayEnvironment } from "#core/enums/runway-environment.enum";
import type { SmokeDriver } from "#core/ports/smoke-driver.port";
import type { SmokeSubject } from "#core/types/smoke-subject.type";

/** The smoke step's inputs. */
export type SmokePreviewRequest = {
  /** The product repository's root folder. */
  readonly repository: string;
  /** The environment just deployed; its hosts are opened. */
  readonly environment: RunwayEnvironment;
  /** The targets this run checks (one CI job per runner); every target when absent. */
  readonly only?: readonly SmokeSubject["target"][];
  /** One driver per target (`PlaywrightSmokeDriver`, `MaestroSmokeDriver`, `ElectronSmokeDriver`). */
  readonly drivers: readonly SmokeDriver[];
  /** The Release simulator builds per mobile app and platform; an app or platform left out is not checked. */
  readonly builds?: Readonly<
    Record<string, { readonly ios?: string | undefined; readonly android?: string | undefined }>
  >;
  /** The template line checkout with the Maestro flows; required with `builds`. */
  readonly templateDir?: string;
};
