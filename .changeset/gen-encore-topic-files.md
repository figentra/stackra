---
"@stackra/gen": patch
---

A service's generated Encore topic files pass Encore's parser. Regenerate (`stackra gen`) to pick it up.

- `events.ts` and `queues.ts` registered each Pub/Sub topic with `registerBrokerTopics` by passing the topic itself,
  which Encore refuses ("invalid topic usage"). Each topic is now registered as a publisher ref,
  `topic.ref<Publisher<BrokerMessage>>()`, the form Encore allows.
- The topics and subscriptions named `BrokerMessage` from `@stackra/queue/contracts`, which Encore cannot resolve
  through the package's dist. gen now writes `.stackra/encore/<member>/broker-message.ts` with the same shape, and the
  generated files import it from there.

Topic names, subscriptions, message bodies and the broker's behaviour are unchanged.
