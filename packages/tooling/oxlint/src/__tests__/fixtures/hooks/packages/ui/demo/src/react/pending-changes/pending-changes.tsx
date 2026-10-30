// lint fixture (rules-of-hooks.test.ts): a class component's hook field (ADR 0305 rule 38).
import { Component } from "./component";
import { useQueue } from "../use-queue/use-queue";

export class PendingChanges extends Component {
  queue = useQueue();

  render(): string {
    return String(this.queue.length);
  }
}
