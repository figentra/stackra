---
"@stackra/pricing": minor
---

Add plan price lists keyed by regional tier and price currency (`planPriceListsOf`, `planPrice`, `priceListKey`),
`isCatalogueDiscount`, rate cards (`rateCardOf`, `meterCharge`), billing terms per pack with separate price and
collection currency and an invoice series per billing seller (`BILLING_PACK_KEYS`, `billingTermsOf`), and offers with
`benefits[]` (`offerOf`, `offerEligible`, `stackOffers`, `applyOffers`) (ADR 0391 to 0393).
