import { api } from "encore.dev/api";
import { container, Greeter } from "./svc";
export const hiA = api({ method: "GET", path: "/a/hi/:name", expose: true }, async ({ name }: { name: string }): Promise<{ msg: string }> => ({ msg: container.get(Greeter).hi(name) }));
