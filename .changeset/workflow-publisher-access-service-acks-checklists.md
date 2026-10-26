---
"@stackra/workflow": minor
---

Bound automations by their publisher: `AutomationService.publish` takes the publisher and refuses
`automation_exceeds_publisher` through the new `PublisherAccess` port (`MemoryPublisherAccessDriver` for tests), and a
published automation whose publisher lost access pauses (`AutomationPaused`, migration `workflow.0004`, `recheck()`).
Add the cross-service service-acked contract (`ServiceAcked`, `AllServicesAcked`, `ServiceAckService`, migration
`workflow.0005`), the checklist engine (`ChecklistTemplate$`, `ChecklistCustomization$`, `IndustryProfile$`,
`checklistView`, `ChecklistService`, completion events, migration `workflow.0006`), the `workflow.signalRetention`
setting and `runDocument` in `./testing` (STA-773, STA-776, STA-844, ADR 0423, 0424, 0427).
