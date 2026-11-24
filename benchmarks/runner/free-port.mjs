/**
 * Stackra file contract:
 * Purpose: ask the operating system for a free local TCP port, so a run's app never clashes with another process.
 * Boundary: opens and closes one listener on 127.0.0.1.
 * Runtime: node
 * Governing contract: STA-2709 (the owner's method rules).
 * Input: none.
 * Output: a port number.
 * Secrets: none.
 */
import { createServer } from "node:net";

export function freePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}
