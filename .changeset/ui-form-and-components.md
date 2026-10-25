---
"@stackra/ui": minor
---

Add the schema form adapters (ADR 0165 decision 2, owner decision 12): the new `./form` entry holds the
platform-neutral engine (a zod schema's react-hook-form resolver and defaults, the schema form handle and the field
descriptor), and each renderer declares `useSchemaForm` and `Field` on it. `Form` takes `form` (and on web `submit`)
to bind `Field.*` by name. Web adds `CheckboxField`, `TextAreaField`, `Turnstile` (Cloudflare's widget,
script-loaded), `Dropdown`, `Kbd`, `Stat` and the `Component<P>` class-component base; native adds `SchemaForm`,
`Stat`, `Component`, `tabBarIcon`, and re-exports HeroUI Native's `ListGroup`, `PressableFeedback`, `useThemeColor`
and `useToast`. `./form` depends on `@stackra/validation` and `zod`.
