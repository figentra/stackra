---
"@stackra/achievements": patch
"@stackra/rules": patch
"@stackra/segments": patch
"@stackra/webhooks": patch
"@stackra/content": patch
"@stackra/collaboration": patch
"@stackra/workflow": patch
"@stackra/settings": patch
---

The scope-pathed models of these packages opt into `MovesWithScope`, so their rows follow a moved scope subtree (`scope.node.moved.v1`) in every service that hosts them: award kinds, awards and their verifications, rule sets, segments and their memberships, webhook endpoints and deliveries, custom fields, their value sets and content revisions, comment threads, comments, their revisions and mentions, automations, checklists and their progress, and stored settings and their revisions. The audit log (append-only, its history kept) and the scope tree itself (moved by `moveSubtree`) stay out.
