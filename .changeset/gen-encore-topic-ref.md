---
"@stackra/gen": patch
---

A service's generated `events.ts` and `queues.ts` build under Encore again. They registered each Pub/Sub topic with
`registerBrokerTopics` by passing the topic itself, which Encore's parser refuses ("invalid topic usage"). Each topic is
now registered as a publisher ref, `topic.ref<Publisher<BrokerMessage>>()`, the form Encore allows. Topic names,
subscriptions and the broker's behaviour are unchanged; regenerate (`stackra gen`) to pick it up.
