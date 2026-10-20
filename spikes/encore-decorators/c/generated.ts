// hand-written stand-in for generator output
import { api } from "encore.dev/api";
import { container, ItemController } from "./controller";
export const getItem = api(
  { method: "GET", path: "/c/items/:id", expose: true },
  async (req: { id: string }): Promise<{ id: string; name: string }> => container.get(ItemController).get(req),
);
