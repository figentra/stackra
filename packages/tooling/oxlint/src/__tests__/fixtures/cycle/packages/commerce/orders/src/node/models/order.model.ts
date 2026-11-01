// lint fixture (no-cycle.test.ts): one side of a two-way relation, and a model that imports a non-model file back.
import { OrderLine } from "./order-line.model";
import { OrderTotals } from "../totals/order-totals";

export class Order {
  line = (): typeof OrderLine => OrderLine;

  totals = new OrderTotals();
}
