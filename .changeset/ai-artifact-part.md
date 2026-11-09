---
"@stackra/ai": minor
---

The ChatSurface draws a `data-tamo-artifact` part by default: an `AttachmentCard` of the file Tamo made (its name with the kind as extension, and its size). Opening or downloading it calls the host's new `onOpenArtifact` or `onDownloadArtifact` with the artifact's id and version; the part never carries a link. `TamoArtifactPart` gains an optional `bytes`, and its `kind` is the file extension.
