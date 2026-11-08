---
"@stackra/notifications": minor
---

Messages can carry buttons. `MessageAction` (`label`, `url`, optional `style`) is new; `OutboundChatMessage.actions`
lists the buttons under a chat message, and `OutboundPush` gains `category` (the app's action category, Expo
`categoryId`) and `actions` (the links behind its buttons). The `device` push driver passes both through: to Expo as
`categoryId` with the links in `data.actions`, and in the Web Push payload. Notify uses them for the approvals bot's
one-tap Approve and Reject (ADR 0533).
