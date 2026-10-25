/**
 * Stackra file contract:
 * Purpose: the type of a `.wasm` import in a Cloudflare Worker: wrangler bundles the file and the import is a compiled
 *          `WebAssembly.Module`.
 * Boundary: an ambient declaration for the `./worker` entry only; referenced by the driver that imports satori's and
 *           resvg's WebAssembly.
 * Runtime: worker
 * Governing contract: ADR 0284 (Workers members); ADR 0127 2026-10-24 note (`./worker` entry).
 */
declare module "*.wasm" {
  /** The compiled module. */
  const module: WebAssembly.Module;
  export default module;
}
