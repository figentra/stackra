/**
 * Stackra file contract:
 * Purpose: `DemoCommand`, `stackra-console demo`: a tour of every component in the current theme (banner, messages,
 *          task lines, a spinner, a progress bar, a table with right-to-left cells, key-value lines, the three note
 *          tones, and on a terminal each prompt), so a product owner sees the look before adopting it.
 * Boundary: writes only to the output; waits between steps only when the run animates, so plain and test runs are
 *           instant. Prompts are asked only when the run is interactive.
 * Runtime: node
 * Governing contract: STA-1730 spec FR-016 to FR-026.
 */
import { Command } from "#core/bases/command.base";
import type { CommandIo } from "#core/types/command-io.type";

/** Shows every console component. */
export class DemoCommand extends Command({
  name: "demo",
  description: "Show every console component",
}) {
  /** Runs the tour and returns the answers it collected. */
  async handle(io: CommandIo): Promise<Readonly<Record<string, unknown>>> {
    const { output, prompt } = io;
    // Waits only where someone can watch it.
    const pause = (ms: number) =>
      io.animate
        ? new Promise<void>((resolve) => {
            setTimeout(resolve, ms);
          })
        : Promise.resolve();
    output.banner();

    output.title("Messages");
    output.info("Information, in the theme's accent");
    output.success("Success");
    output.warn("A warning, on standard error");
    output.error("An error, on standard error");
    output.list(["A list item", "Another item", "عنصر بالعربية"]);

    output.title("Tasks");
    await output.task("Resolving the workspace", () => pause(300));
    await output.task("Generating the wiring", () => pause(600));
    await output.task("Writing the manifest", () => pause(200));

    output.title("Spinner and progress");
    const spinner = output.spinner("Fetching the registry index");
    await pause(900);
    spinner.update("Checking 128 packages");
    await pause(900);
    spinner.stop("Registry index is current");
    const progress = output.progress(40, "Uploading");
    for (let step = 0; step < 40; step += 1) {
      await pause(35);
      progress.advance();
    }
    progress.finish();

    output.title("Table and key-value lines");
    output.table(
      ["Account", "City", "Rows"],
      [
        ["Acme", "Riyadh", 1200],
        ["شركة الأمل", "الرياض", 42],
        ["日本商事", "Tokyo", 7],
      ],
    );
    output.line();
    output.keyValue({ Version: "0.2.0", Environment: "staging", Region: "eu-central-1" });

    output.title("Notes");
    output.note("Run stackra gen after adding a command.", "info");
    output.note("Two migrations are pending.", "warning");
    output.note("The production database is read-only.", "alert");

    if (!io.interactive) {
      output.info("Run this in a terminal to try the prompts.");
      return { prompts: false };
    }
    output.title("Prompts");
    const name = await prompt.text({ message: "What is your name?", default: "Ada" });
    const tool = await prompt.select({
      message: "Which package manager?",
      choices: [{ value: "pnpm", hint: "recommended" }, { value: "npm" }, { value: "yarn" }],
      default: "pnpm",
    });
    const extras = await prompt.multiselect({
      message: "Which extras?",
      choices: [{ value: "tests" }, { value: "lint" }, { value: "ci" }],
      default: ["tests"],
    });
    const region = await prompt.search({
      message: "Which region?",
      choices: [
        { value: "eu-central-1", label: "Frankfurt" },
        { value: "eu-west-1", label: "Ireland" },
        { value: "me-central-1", label: "UAE", hint: "الإمارات" },
        { value: "us-east-1", label: "Virginia" },
      ],
    });
    await prompt.password({ message: "A secret (never shown)" });
    const sure = await prompt.confirm({ message: "Looks good?", default: true });
    output.success(`Thanks, ${name}`);
    return { name, tool, extras, region, sure };
  }
}
