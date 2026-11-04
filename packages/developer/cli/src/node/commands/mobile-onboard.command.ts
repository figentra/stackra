/**
 * Stackra file contract:
 * Purpose: `MobileOnboardCommand`, `stackra mobile onboard [--app <key>] [--check|--live]`: takes a product's mobile
 *          app from nothing to store-ready (`runMobileOnboard`) and draws every step as a checklist row (done ok,
 *          planned info, manual warn, blocked skip; `state` and the owner's `manual` steps ride along for `--json`),
 *          then the owner's steps as a note and the files written. Exit 0 when every step is done or planned, 3 while
 *          one is manual or blocked, 2 for a usage error.
 * Boundary: flags and drawing only; the drivers and the checks are `runMobileOnboard`'s, the steps Runway's.
 * Runtime: node
 * Governing contract: ADR 0482; ADR 0506; STA-1966.
 */
import { Command, Option, type CommandIo } from "@stackra/console";
import type { CheckStatus } from "@stackra/console/contracts";
import { Str } from "@stackra/validation";

import { runMobileOnboard } from "#node/product/functions/run-mobile-onboard.function";

/** The checklist status of each step state. */
const STATUS: Readonly<Record<string, CheckStatus>> = {
  done: "ok",
  planned: "info",
  manual: "warn",
  blocked: "skip",
};

/** Onboards a product's mobile app. */
export class MobileOnboardCommand extends Command({
  name: "mobile:onboard",
  description:
    "Onboard a product's mobile app: ids, EAS project, Apple bundle id, Google project and Firebase, Sentry, signing, push, stores",
  bin: true,
}) {
  /** The app key. */
  @Option({ description: "The app key (default: the runway's only mobile app)" })
  @Str
  app?: string;

  /** Read the real stores. */
  @Option({
    description: "Read the real stores and plan only what is missing (GitHub Actions only)",
  })
  check = false;

  /** Make the changes. */
  @Option({ description: "Make the changes (GitHub Actions only)" })
  live = false;

  /** Onboards the app and draws its steps. */
  async handle(io: CommandIo): Promise<number> {
    const result = await runMobileOnboard(io.cwd, {
      app: this.app,
      check: this.check,
      live: this.live,
    });
    const mode = this.live
      ? ""
      : this.check
        ? " (check: read only, nothing written)"
        : " (offline plan: nothing is called or written)";
    io.output.checklist({
      title: `mobile onboard ${result.app}${mode}: ${result.ids.bundleId} / ${result.ids.packageName}`,
      rows: result.steps.map((step) => ({
        name: step.key,
        status: STATUS[step.state] ?? "info",
        detail: step.detail,
        state: step.state,
        ...(step.manual === undefined ? {} : { manual: step.manual }),
      })),
    });
    const owner = result.steps.flatMap((step) =>
      step.manual === undefined ? [] : [step.key, ...step.manual.map((line) => `  - ${line}`)],
    );
    if (owner.length > 0) io.output.note(owner.join("\n"), "warning", "Left for the owner");
    for (const file of result.written) io.output.line(`wrote ${file}`);
    return result.steps.some((step) => step.state === "manual" || step.state === "blocked") ? 3 : 0;
  }
}
