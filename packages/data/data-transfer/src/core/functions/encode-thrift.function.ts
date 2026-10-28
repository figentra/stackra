/**
 * Stackra file contract:
 * Purpose: `encodeThrift`, which writes a struct in the Thrift compact protocol: the encoding of a Parquet file's footer
 *          (`FileMetaData`) and of each page header.
 * Boundary: a pure function, internal to the Parquet writer. It writes only the types `ThriftValue` names (i32, i64,
 *           binary, list, struct); field ids must ascend. Integers stay below 2^53.
 * Runtime: isomorphic
 * Governing contract: ADR 0163 and ADR 0190 (2026-10-29 amendments: the Parquet writer); Apache Thrift compact
 *                     protocol specification.
 */
import type { ThriftFields } from "#core/types/thrift-fields.type";
import type { ThriftValue } from "#core/types/thrift-value.type";

/** Compact protocol type ids. */
const TYPE_ID = { i32: 5, i64: 6, binary: 8, list: 9, struct: 12 } as const;

/** Appends `n` (a non-negative integer) as an unsigned LEB128 varint. */
function varint(out: number[], n: number): void {
  let rest = n;
  while (rest >= 0x80) {
    out.push((rest % 0x80) | 0x80);
    rest = Math.floor(rest / 0x80);
  }
  out.push(rest);
}

/** Zigzag-maps a signed integer onto the non-negative ones. */
function zigzag(n: number): number {
  return n >= 0 ? n * 2 : -n * 2 - 1;
}

/** Appends one value's body (no field header). */
function value(out: number[], item: ThriftValue): void {
  switch (item.type) {
    case "i32":
    case "i64": {
      varint(out, zigzag(item.value));
      return;
    }
    case "binary": {
      const bytes =
        typeof item.value === "string" ? new TextEncoder().encode(item.value) : item.value;
      varint(out, bytes.length);
      for (const byte of bytes) out.push(byte);
      return;
    }
    case "list": {
      const size = item.items.length;
      if (size < 15) out.push((size << 4) | TYPE_ID[item.element]);
      else {
        out.push(0xf0 | TYPE_ID[item.element]);
        varint(out, size);
      }
      for (const element of item.items) value(out, element);
      return;
    }
    case "struct": {
      struct(out, item.fields);
    }
  }
}

/** Appends a struct: each set field with its header, then the stop byte. */
function struct(out: number[], fields: ThriftFields): void {
  let last = 0;
  for (const [id, field] of fields) {
    if (field === undefined) continue;
    if (id <= last) throw new RangeError(`Thrift field ids must ascend: ${id} after ${last}`);
    const delta = id - last;
    if (delta <= 15) out.push((delta << 4) | TYPE_ID[field.type]);
    else {
      out.push(TYPE_ID[field.type]);
      varint(out, zigzag(id));
    }
    value(out, field);
    last = id;
  }
  out.push(0);
}

/**
 * The compact-protocol bytes of a struct with `fields`.
 *
 * @throws RangeError when the field ids do not ascend.
 * @example
 * encodeThrift([[1, { type: "i32", value: 1 }]]); // Uint8Array [0x15, 0x02, 0x00]
 */
export function encodeThrift(fields: ThriftFields): Uint8Array {
  const out: number[] = [];
  struct(out, fields);
  return Uint8Array.from(out);
}
