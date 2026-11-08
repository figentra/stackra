---
"@stackra/shipping": minor
---

`RateQuote.carrier` and `Shipment.carrier`, both optional: an aggregator connection (one account quoting and booking
many carriers) names the carrier that delivers, while the connection's `provider` stays the aggregator's. Direct
carriers leave it out (STA-2625).
