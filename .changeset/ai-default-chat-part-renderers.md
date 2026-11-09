---
"@stackra/ai": minor
---

`@stackra/ai`'s `ChatSurface` now draws Tamo's data parts out of the box with @stackra/ui: a table as a `Table`
(numbers written by column type), a chart as the `BarChart`, `LineChart`, `AreaChart`, `PieChart`, `DonutChart` or
`ScatterChart` of its kind, KPIs as a `Kpi` or a `KpiGroup` of `Stat`s (number, money, percent, duration), a question
as a `QuestionnaireCard` that answers through the new `onAnswer` prop (read-only without it), and suggestions as
`PromptSuggestions` that send through `onSend`. A host's `renderers` entry still wins for its kind; `widget_ref`,
`form`, `report` and `artifact` keep no default. `./react` exports `defaultChatPartRenderers` and `ChatPartOptions`,
which every part renderer now gets as its third argument.
