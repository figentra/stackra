/**
 * Stackra file contract:
 * Purpose: `SHOP_REFS`, the demo shop's product query and action refs, as gen writes them into an app's
 *          `#stackra/clients`: list, get, create and restock.
 * Boundary: refs only; the demo frame's transport answers them from memory, so nothing leaves the phone.
 * Runtime: react-native
 * Governing contract: ADR 0260 (generated client refs); ADR 0307 (resource operations).
 */
import { actionRef, queryRef } from "@stackra/clients";
import { z } from "zod";

/** One product row. */
const PRODUCT = z.object({
  id: z.string(),
  name: z.string(),
  stock: z.number().int(),
  status: z.enum(["active", "draft"]),
});

/** The demo shop's refs. */
export const SHOP_REFS = Object.freeze({
  list: queryRef("shop.product.list@1", {
    input: z.object({ limit: z.number().int().optional(), cursor: z.string().optional() }).loose(),
    output: z.object({ items: z.array(PRODUCT), hasMore: z.boolean() }),
  }),
  get: queryRef("shop.product.get@1", {
    input: z.object({ productId: z.string() }),
    output: PRODUCT,
  }),
  create: actionRef("shop.product.create@1", {
    input: z.object({
      name: z.string().min(1),
      stock: z.number().int().min(0),
      status: z.enum(["active", "draft"]),
    }),
    output: z.object({ id: z.string() }),
  }),
  restock: actionRef("shop.product.restock@1", {
    input: z.object({
      productId: z.string(),
      quantity: z.number().int().min(1),
      note: z.string().optional(),
    }),
    output: z.object({ stock: z.number().int() }),
  }),
});
