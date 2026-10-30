// lint fixture (no-cycle.test.ts): the other side of the two-way relation.
import { Order } from "./order.model";

export class OrderLine {
  order = (): typeof Order => Order;
}
