/**
 * Stackra file contract:
 * Purpose: `renderArtifactPart`, the default renderer of a `data-tamo-artifact` part: a @stackra/ui `AttachmentCard` of
 *          the file Tamo made (its name with the kind as extension, and its size), whose name opens it through the
 *          turn's `onOpenArtifact` and whose download button calls `onDownloadArtifact`.
 * Boundary: pure over the part's data, read defensively: without a string id and name and a whole version it draws
 *           nothing. The part never carries a link: the host mints one (Tamo's `artifacts.artifact.get@1`) when the
 *           person opens or downloads the file, so a link never sits in a conversation.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0507 (Ask Tamo); ADR 0165 (UI through @stackra/ui); Tamo spec
 *                     generative-ui-tools-artifacts (G4)
 */
import { AttachmentCard } from "@stackra/ui/react";
import type { ReactNode } from "react";

import type { ChatPartOptions } from "#react/chat-surface/chat-part-options.type";

/** A kind that is a file extension: lowercase letters and digits. */
const EXTENSION = /^[a-z0-9]{1,8}$/;

/**
 * An artifact part as an AttachmentCard, or null when it has no id, name or version.
 *
 * @example
 * renderArtifactPart({ artifactId: "art_1", name: "Open orders", kind: "csv", version: 1, bytes: 2048 }, part, options)
 */
export function renderArtifactPart(
  data: unknown,
  _part: unknown,
  options: ChatPartOptions,
): ReactNode {
  if (typeof data !== "object" || data === null) return null;
  const { artifactId, name, kind, version, bytes } = data as Readonly<Record<string, unknown>>;
  if (typeof artifactId !== "string" || artifactId === "") return null;
  if (typeof name !== "string" || name === "") return null;
  if (typeof version !== "number" || !Number.isInteger(version) || version < 1) return null;
  const { onOpenArtifact, onDownloadArtifact } = options;
  return (
    <AttachmentCard
      name={typeof kind === "string" && EXTENSION.test(kind) ? `${name}.${kind}` : name}
      size={typeof bytes === "number" && bytes >= 0 ? bytes : undefined}
      onOpen={onOpenArtifact === undefined ? undefined : () => onOpenArtifact(artifactId, version)}
      onDownload={
        onDownloadArtifact === undefined ? undefined : () => onDownloadArtifact(artifactId, version)
      }
    />
  );
}
