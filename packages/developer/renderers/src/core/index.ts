/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/renderers until `stackra gen` writes the entry barrels (STA-339):
 *          the assistants, `renderAssistant`, its error and its result types.
 * Boundary: names each re-export and declares nothing. The per-assistant renderers, the tool and event maps and the
 *           Markdown helpers stay internal; `renderAssistant` is the one way in.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0286 (decision 6).
 */
export { Assistant } from "#core/enums/assistant.enum";
export { RenderInputError } from "#core/errors/render-input.error";
export { renderAssistant } from "#core/functions/render-assistant.function";
export type { RenderOptions } from "#core/types/render-options.type";
export type { RenderResult } from "#core/types/render-result.type";
export type { RenderedFile } from "#core/types/rendered-file.type";
export type { SkippedDocument } from "#core/types/skipped-document.type";
