---
"@stackra/support": minor
---

One home for the helpers other packages had copied (stackra-224, owner D10): `base64url` is now public (encodes an
`ArrayBuffer` too, decodes padded text), and new `decodeBase64` (never throws, `undefined` for bad text), `crc32`
(bytes or a string, chunked), `escapeHtml`, `escapeXml` (refuses characters XML 1.0 cannot carry), `htmlToText`,
`isRecord(value, keys?)`, `snakeCase`, `kebabCase`, `camelCase`, `pascalCase` and `ageOn(birth, on, leapBirthday)`
with calendar's 29 February rule (`february_28` or `march_1`, no default). README and AGENTS list them.
