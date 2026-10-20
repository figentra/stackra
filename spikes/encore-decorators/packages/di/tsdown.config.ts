import { defineConfig } from "tsdown";
export default defineConfig({
  entry: ["src/index.ts"], format: "esm", dts: true, clean: true, fixedExtension: true,
  inputOptions: (input) => ({ ...input, transform: { ...input.transform, decorator: { legacy: true, emitDecoratorMetadata: false } } }),
});
