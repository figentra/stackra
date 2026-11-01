# Implementation Plan: the events testing plugin connects only listeners the app can build

**Spec**: `spec.md` · **Linear**: STA-1740 · **Branch**: `figentra/sta-1740-events-connect-buildable`

This Mac runs only oxfmt and oxlint; tests run on a box through the testing session (stackra-8a).

| Step | What                                                                              | Gate                |
| ---- | --------------------------------------------------------------------------------- | ------------------- |
| 1    | The plugin passes `connect` a view of the app whose `has` is false for an unbound | events tests        |
| 2    | A plugin test with a listener that needs an unbound dependency                    | events tests        |
| 3    | The four webhooks `deliverWebhook` tests pass again                               | webhooks tests, box |
