// Stackra file contract:
// Purpose: `ScaleLinkRecord`, the `ScaleLink` the TypeScript driver passes to `connect`, as an Expo record.
// Boundary: data only; field names equal `ScaleLink` in src/core/types/scale-link.type.ts.
// Runtime: iOS
// Governing contract: ADR 0478 (decision 5).
import ExpoModulesCore

struct ScaleLinkRecord: Record {
  @Field var transport: String = "ble"
  @Field var address: String = ""
  @Field var baudRate: Int = 9600
  @Field var bleService: String = ""
  @Field var bleNotify: String = ""
  @Field var bleWrite: String = ""
}
