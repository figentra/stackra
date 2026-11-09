---
"@stackra/panel": minor
"@stackra/ui": minor
"@stackra/ai": minor
---

`ChatFormPart` (`@stackra/panel/react`) draws an action's form in a chat turn from its JSON Schema input: one field per key, drawn as a screen draws it, prefilled by the assistant, with uploads through the host's `upload`, and sent as the person's answer. `useZodFormHandle` (`@stackra/ui/form`) runs a form over a zod schema with no class, and `useSchemaFormHandle` now builds on it. `TamoFormPart` gains `id`, which the host answers with the sent values, as a question's.
