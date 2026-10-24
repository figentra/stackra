/**
 * Stackra file contract:
 * Purpose: the web `DropZone` compound on HeroUI Pro's DropZone (a file drop target with a file list): the root and
 *          the file-list parts are HeroUI Pro's own; the area maps `label`, and the area and the input map
 *          `isDisabled`.
 * Boundary: no styling or behaviour of its own; the look needs `@heroui-pro/react/css`. The compound exposes the
 *          documented parts: HeroUI Pro's `DropZone.Root` is left out. `useDropZonePickerContext` is HeroUI Pro's own.
 *          Imports the `drop-zone` subpath.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-003.
 */
import {
  DropZone as HeroDropZone,
  type DropZoneProps as HeroDropZoneProps,
} from "@heroui-pro/react/drop-zone";

import { DropZoneArea } from "#react/drop-zone/drop-zone-area";
import { DropZoneInput } from "#react/drop-zone/drop-zone-input";

export { useDropZonePickerContext } from "@heroui-pro/react/drop-zone";

/** Props of the web DropZone root: HeroUI Pro's own, which has no prop the Stackra vocabulary renames. */
export type DropZoneProps<E extends keyof React.JSX.IntrinsicElements = "div"> =
  HeroDropZoneProps<E> & Omit<React.JSX.IntrinsicElements[E], keyof HeroDropZoneProps<E>>;

/** The root: HeroUI Pro's, the element that holds the area, the input and the file list. */
function DropZoneRoot<E extends keyof React.JSX.IntrinsicElements = "div">(
  props: DropZoneProps<E>,
) {
  return <HeroDropZone.Root<E> {...props} />;
}

/** The parts of the compound, typed from HeroUI Pro's own so the declaration output can name them. */
interface DropZoneParts {
  /** The target files are dropped on; named by `label`. */
  readonly Area: typeof DropZoneArea;
  /** The icon drawn in the area. */
  readonly Icon: typeof HeroDropZone.Icon;
  /** The prompt text in the area. */
  readonly Label: typeof HeroDropZone.Label;
  /** The hint under the prompt, for example the accepted types. */
  readonly Description: typeof HeroDropZone.Description;
  /** The button that opens the file picker. */
  readonly Trigger: typeof HeroDropZone.Trigger;
  /** The file input behind the trigger; named by `label`. */
  readonly Input: typeof DropZoneInput;
  /** The list of chosen files. */
  readonly FileList: typeof HeroDropZone.FileList;
  /** One chosen file; takes an upload `status`. */
  readonly FileItem: typeof HeroDropZone.FileItem;
  /** The badge that shows a file's format. */
  readonly FileFormatIcon: typeof HeroDropZone.FileFormatIcon;
  /** The wrapper of a file's name and meta text. */
  readonly FileInfo: typeof HeroDropZone.FileInfo;
  /** The file's name. */
  readonly FileName: typeof HeroDropZone.FileName;
  /** The file's size or other detail. */
  readonly FileMeta: typeof HeroDropZone.FileMeta;
  /** The upload progress bar of a file. */
  readonly FileProgress: typeof HeroDropZone.FileProgress;
  /** The track of the progress bar. */
  readonly FileProgressTrack: typeof HeroDropZone.FileProgressTrack;
  /** The filled part of the progress bar. */
  readonly FileProgressFill: typeof HeroDropZone.FileProgressFill;
  /** The button that retries a failed upload. */
  readonly FileRetryTrigger: typeof HeroDropZone.FileRetryTrigger;
  /** The button that removes a file. */
  readonly FileRemoveTrigger: typeof HeroDropZone.FileRemoveTrigger;
}

/**
 * A file drop target: `DropZone.Area` holds `DropZone.Icon`, `DropZone.Label`, `DropZone.Description` and
 * `DropZone.Trigger`; `DropZone.Input` takes the picked files; `DropZone.FileList` lists them.
 */
export const DropZone: typeof DropZoneRoot & DropZoneParts = Object.assign(DropZoneRoot, {
  Area: DropZoneArea,
  Icon: HeroDropZone.Icon,
  Label: HeroDropZone.Label,
  Description: HeroDropZone.Description,
  Trigger: HeroDropZone.Trigger,
  Input: DropZoneInput,
  FileList: HeroDropZone.FileList,
  FileItem: HeroDropZone.FileItem,
  FileFormatIcon: HeroDropZone.FileFormatIcon,
  FileInfo: HeroDropZone.FileInfo,
  FileName: HeroDropZone.FileName,
  FileMeta: HeroDropZone.FileMeta,
  FileProgress: HeroDropZone.FileProgress,
  FileProgressTrack: HeroDropZone.FileProgressTrack,
  FileProgressFill: HeroDropZone.FileProgressFill,
  FileRetryTrigger: HeroDropZone.FileRetryTrigger,
  FileRemoveTrigger: HeroDropZone.FileRemoveTrigger,
});
