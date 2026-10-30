/**
 * Stackra file contract:
 * Purpose: `killSwitchServiceWorker()`, the source of a self-retiring `sw.js` (ADR 0325 rule 18). Published at the
 *          installed worker's URL, browsers pick it up on their next update check; it activates at once, deletes
 *          every Cache Storage cache, unregisters itself and reloads each open tab onto the network.
 * Boundary: returns plain JavaScript text, nothing imported, so it is served as is without the app's build; writing it
 *           to the static output and retiring it again is the runbook's (runbooks/deploys, "Retire a service worker").
 * Runtime: worker
 * Governing contract: ADR 0325 (rule 18); ADR 0255.
 */

/**
 * The kill-switch worker's source, to publish as `sw.js` in place of the generated worker.
 *
 * @example
 * writeFileSync("dist/sw.js", killSwitchServiceWorker());
 */
export function killSwitchServiceWorker(): string {
  return `// Stackra kill-switch service worker (ADR 0325 rule 18): retires the installed worker.
self.addEventListener("install", () => {
  self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await self.caches.keys();
      await Promise.all(keys.map((key) => self.caches.delete(key)));
      await self.registration.unregister();
      const tabs = await self.clients.matchAll({ type: "window" });
      // One tab that cannot navigate must not keep the others on the retired worker's pages.
      await Promise.allSettled(tabs.map((tab) => tab.navigate(tab.url)));
    })(),
  );
});
`;
}
