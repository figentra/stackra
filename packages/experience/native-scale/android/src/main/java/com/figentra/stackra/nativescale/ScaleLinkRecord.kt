// Stackra file contract:
// Purpose: `ScaleLinkRecord`, the `ScaleLink` the TypeScript driver passes to `connect`, as an Expo record.
// Boundary: data only; field names equal `ScaleLink` in src/core/types/scale-link.type.ts.
// Runtime: Android
// Governing contract: ADR 0478 (decision 5).
package com.figentra.stackra.nativescale

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

class ScaleLinkRecord : Record {
  @Field val transport: String = "ble"
  @Field val address: String = ""
  @Field val baudRate: Int = 9600
  @Field val bleService: String = ""
  @Field val bleNotify: String = ""
  @Field val bleWrite: String = ""
}
