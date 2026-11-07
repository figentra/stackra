---
"@stackra/shipping": minor
---

`LabelGateway` gains an optional `findLabel(reference)`: the shipment the carrier booked for a `createLabel` reference,
or null when it booked none. A caller whose `createLabel` reply was lost asks it before buying again, so one reference
is never booked twice; a connector whose carrier cannot search by reference leaves it out.
