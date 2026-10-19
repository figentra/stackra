# @stackra/tsdown-config

Shared build preset. A library's `tsdown.config.ts` is:

```ts
import { library } from "@stackra/tsdown-config";

export default library(); // src/index.ts → dist/index.js + index.d.ts
export default library({ index: "src/index.ts", react: "src/react/index.ts" }); // subpath exports
export default library(undefined, { decorators: true }); // DI tier
```
