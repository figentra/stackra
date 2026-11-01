---
"@stackra/panel": minor
---

An action of another model than the resource's is labelled `<module>::resources.<model>.actions.<action_model>_<verb>`,
so two actions with one verb of different models on one page no longer share a label; the resource's own actions keep
`actions.<verb>`.
