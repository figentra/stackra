/**
 * Stackra file contract:
 * Purpose: the props every runtime's `SetupGuide` takes: the title, the tasks, how a task is ticked, whether the list
 *          is open and the words of the progress and the toggle. Each runtime's `SetupGuideProps` is this plus its own
 *          base props.
 * Boundary: types only. The guide never stores which tasks are done: the app owns `tasks` and answers
 *           `onCompleteChange`. The list is open by default until every task is done, then collapses.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); WCAG 2.2 SC 4.1.2, 4.1.3; design-system gap
 *          inventory row 17.
 */
import type { SetupGuideTask } from "#contracts/types/setup-guide-task.type";

/** Props shared by the web and native `SetupGuide`. */
export interface SetupGuideContractProps {
  /** The card's title, for example "Set up your store". */
  readonly title: string;
  /** One line under the title. */
  readonly description?: string | undefined;
  /** The tasks, in order. */
  readonly tasks: readonly SetupGuideTask[];
  /** Called when the user ticks or unticks a task; left out, the boxes are read-only. */
  readonly onCompleteChange?: ((id: string, isComplete: boolean) => void) | undefined;
  /** Whether the task list is shown, for a controlled guide. */
  readonly isExpanded?: boolean | undefined;
  /** Whether the task list starts shown. Defaults to true until every task is done. */
  readonly defaultExpanded?: boolean | undefined;
  /** Called when the user shows or hides the task list. */
  readonly onExpandedChange?: ((isExpanded: boolean) => void) | undefined;
  /** Writes the progress, for example "2 of 5 tasks done". Defaults to the `ui` catalogue's sentence. */
  readonly progressLabel?: ((done: number, total: number) => string) | undefined;
  /** The text shown once every task is done. Defaults to the `ui` catalogue's "All set". */
  readonly completeLabel?: string | undefined;
  /** The spoken name of the show/hide button. Defaults to the `ui` catalogue's "Show tasks" or "Hide tasks". */
  readonly toggleLabel?: ((isExpanded: boolean) => string) | undefined;
}
