---
"@stackra/integrations": minor
---

Managed or bring-your-own connectors, form bodies and the JWT bearer grant (STA-792, STA-672). An Integration may ask
for form-encoded request bodies (`requestBody: "form"`) and declare an HMAC webhook signature recipe
(`webhooks.signature`, `WebhookSignature`) and an event id path. A seventh auth type, `OAuth2JwtBearer`, signs a
service-account assertion and caches the token it trades for. A Connection carries its `source` (`ProviderSource`:
managed or BYO) and a managed `resourceId`. `./contracts` adds the `ManagedProvisioning` port with `ManagedResource`,
`ManagedCostEvent`, `ProvisioningRequest`, `ProvisioningStatus`, `ProviderCategoryRecord` and `ProviderCatalogueEntry`;
`.` adds `MemoryManagedProvisioningDriver` and the `PROVIDER_CATEGORY_SEEDS`, `PROVIDER_CATALOGUE_SEEDS` (US and EU
payment gateways) and `MANAGED_PROVISIONING_TEMPLATES` seeds.
