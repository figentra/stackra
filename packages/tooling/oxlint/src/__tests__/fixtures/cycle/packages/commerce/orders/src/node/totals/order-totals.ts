// lint fixture (no-cycle.test.ts): a non-model file in a cycle with a model; the rule still reports it here.
import { Order } from "../models/order.model";

export class OrderTotals {
  isOrder = (value: unknown): boolean => value instanceof Order;
}
