# Tasks: AI everywhere

**Input**: `.agents/specs/sta-1629-ai-everywhere/`

- [x] T001 Verify core main state; ADRs 0490, 0491, 0492; spec, plan, tasks; Linear STA-1629 to STA-1638
- [ ] T002 Owner approval of the ADRs and answers to the six owner questions (gate for every task below)

## Wave A

- [ ] T010 [lane 2, STA-1631] `ToolSource.Client`, gen `#stackra/client-tools`, gen checks, session filtering — covers: FR-201 to FR-204
- [ ] T011 [lane 2, STA-1631] runtime client-tool park, `ai.run.client_result`, timeout, generated handlers — covers: FR-205, FR-206
- [ ] T012 [lane 2, STA-1631] `PageContext` schema, route `context`, panel publishing, server resolution — covers: FR-207, FR-208
- [ ] T020 [lane 7, STA-1636] `Reranker` port and drivers, `rerank` option — covers: FR-701
- [ ] T021 [lane 7, STA-1636] Arabic stemmer lane, Arabizi, `search.synonym`, evaluation `test:int` — covers: FR-702 to FR-704
- [ ] T030 [lane 8, STA-1637] `tools-retrieval` entry, GPU capacity provider, `.py` placement check — covers: FR-801, FR-806
- [ ] T031 [lane 8, STA-1637] forecast image, `Forecaster` port and driver — covers: FR-802
- [ ] T032 [lane 8, STA-1637] `Recommender` port, Postgres driver, recommend image and driver — covers: FR-803, FR-804
- [ ] T033 [lane 8, STA-1637] speech image as an in-region provider — covers: FR-805

## Wave B

- [ ] T040 [lane 1, STA-1630] `@stackra/ai/react` and `/native` hooks and stream client — covers: FR-101 to FR-103
- [ ] T041 [lane 1, STA-1630] sidekick contract and implementations; move three ui-pro components — covers: FR-104, FR-105
- [ ] T042 [lane 1, STA-1630] `@stackra/native-audio` and `useVoiceInput` — covers: FR-106
- [ ] T050 [lane 3, STA-1632] panel view and dashboard actions; settings user actions — covers: FR-301 to FR-304
- [ ] T060 [lane 6, STA-1635] payer approval kind, staff refusal, redaction rules, hosted pay route contract — covers: FR-601 to FR-604

## Wave C

- [ ] T070 [lane 4, STA-1633] `Tour` kind, validator, progress, runner, onboarding — covers: FR-401 to FR-405
- [ ] T080 [lane 5, STA-1634] `Card` kind, renderers, `ui://` build, message projection, shopper mode — covers: FR-501 to FR-504
- [ ] T090 [lane 9, STA-1638] gateway contracts, manifest registration, runway edge routes — covers: FR-901 to FR-903

## Dependencies (other repos)

- [ ] D01 OS STA-705: ai service hosts runtime, gateway, relay, speech route — covers: FR-904
- [ ] D02 OS: migrations for lane 3 and 4 tables in the service that mounts panel, settings, experience
- [ ] D03 OS integrations: WhatsApp messages driver and message projection
- [ ] D04 Commerce: shopper agent, cards, timeline, `checkout.prepare`, B2B, marketplace — covers: FR-505, FR-605
- [ ] D05 OS lines: sidekick placement, anchors, page context — covers: FR-107

## Close

- [ ] T100 One changeset per changed package; READMEs and AGENTS updated per lane
- [ ] T101 Tester stackra-f4 gate green per lane commit — covers: SC-005
