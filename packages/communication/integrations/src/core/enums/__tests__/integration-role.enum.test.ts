/**
 * Stackra file contract:
 * Purpose: unit tests of `IntegrationRole` and `ConnectorKind`: their codes, in order.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0355 (decision 1); ADR 0231; ADR 0447 (the edi, fraud-scoring and document-store
 *                     kinds); STA-793 (the ad-platform kind).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { ConnectorKind } from "#core/enums/connector-kind.enum";
import { IntegrationRole } from "#core/enums/integration-role.enum";

describe("IntegrationRole and ConnectorKind", () => {
  it("have their codes", () => {
    expect(Enum.values(IntegrationRole)).toEqual([
      "driver",
      "channel",
      "surface",
      "connector",
      "webhooks",
    ]);
    expect(Enum.values(ConnectorKind)).toEqual([
      "carrier",
      "fulfilment_provider",
      "sales_channel",
      "product_feed",
      "edi",
      "fraud_scoring",
      "document_store",
      "ad_platform",
    ]);
  });
});
