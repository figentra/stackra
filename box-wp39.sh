#!/usr/bin/env bash
# wp-39 (STA-2063) on ci-box, untracked and never committed: refresh gen's goldens, run gen's tests, print the golden
# patch, then type-check the golden api.ts and encore.service.ts against encore.dev installed out of tree.
set -uo pipefail
ROOT=$(pwd)
echo "=== build gen deps"
pnpm turbo run build --filter=@stackra/gen^... --output-logs=errors-only 2>&1 | tail -4
cd "$ROOT/packages/developer/gen"
echo "=== golden refresh"
UPDATE_GOLDEN=1 pnpm exec vitest run src/node/__tests__/golden.test.ts 2>&1 | grep -aE -A30 "FAIL |Test Files|Tests " | head -60
echo "=== gen tests"
pnpm exec vitest run 2>&1 | grep -aE -B2 -A40 "FAIL |Test Files|Tests " | head -200
cd "$ROOT"
git add -A packages/developer/gen/__golden__ > /dev/null 2>&1
git status --short -- packages/developer/gen/__golden__
echo "=== PATCH BEGIN"
git diff --cached --binary -- packages/developer/gen/__golden__ | gzip -9 | base64 -w0
echo
echo "=== PATCH END"

echo "=== encore type-check"
GOLDEN="$ROOT/packages/developer/gen/__golden__/service/expected/services/shop/.stackra/encore/shop"
CHECK=$(mktemp -d /tmp/wp39-encore.XXXXXX)
mkdir -p "$CHECK/encore/shop" "$CHECK/entry" "$CHECK/stubs/encore" "$CHECK/stubs/node/actions" \
  "$CHECK/stubs/node/schemas" "$CHECK/stubs/stackra/actions" "$CHECK/stubs/stackra/contracts"
for name in api encore.service database; do cp "$GOLDEN/$name.ts.golden" "$CHECK/encore/shop/$name.ts"; done
cd "$CHECK"
npm init -y > /dev/null
npm install --no-audit --no-fund --silent encore.dev typescript@5 2>&1 | tail -3
cat > stubs/stackra/contracts/index.ts <<'EOF'
export const ActorKind = { User: "user", Anonymous: "anonymous" } as const;
export type Actor = { readonly kind: "user" | "anonymous"; readonly id: string };
export declare function mintPublicId<P extends string>(prefix: P): `${P}_${string}`;
EOF
cat > stubs/stackra/actions/index.ts <<'EOF'
import type { Actor } from "@stackra/contracts";
type OutputOf<T> = T extends { handle: (...args: never[]) => Promise<infer O> } ? O : never;
type InputOf<T> = T extends { handle: (input: infer I, ...rest: never[]) => unknown } ? I : never;
export declare class ActionPipeline {
  constructor(resolver: unknown);
  execute<C extends abstract new (...args: never[]) => { handle: (...args: never[]) => Promise<unknown> }>(
    type: C,
    input: InputOf<InstanceType<C>>,
    request: { actor: Actor },
  ): Promise<OutputOf<InstanceType<C>>>;
}
EOF
mkdir -p stubs/stackra/database/node
echo 'export declare function provideDatabaseUrl(url: string): void;' > stubs/stackra/database/node/index.ts
cat > stubs/encore/auth.ts <<'EOF'
import type { Actor } from "@stackra/contracts";
export declare function getAuthData(): { userID: string; actor: Actor } | null;
EOF
cat > stubs/node/schemas/cancel-order-input.schema.ts <<'EOF'
export class CancelOrderInput {
  orderId!: string;
}
EOF
cat > stubs/node/schemas/cancel-order-output.schema.ts <<'EOF'
export class CancelOrderOutput {
  cancelled!: boolean;
}
EOF
cat > stubs/node/actions/cancel-order.action.ts <<'EOF'
import type { CancelOrderInput } from "../schemas/cancel-order-input.schema";
import type { CancelOrderOutput } from "../schemas/cancel-order-output.schema";
export class CancelOrderAction {
  async handle(input: CancelOrderInput): Promise<CancelOrderOutput> {
    return { cancelled: input.orderId !== "" };
  }
}
EOF
cat > entry/server.ts <<'EOF'
export declare const app: { handlers: { run<T>(call: (container: unknown) => T | Promise<T>): Promise<T> } };
EOF
cat > tsconfig.json <<'EOF'
{
  "compilerOptions": {
    "target": "es2022",
    "module": "esnext",
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "experimentalDecorators": false,
    "paths": {
      "~encore/*": ["./stubs/encore/*"],
      "#node/*": ["./stubs/node/*"],
      "@stackra/*": ["./stubs/stackra/*/index.ts"]
    }
  },
  "include": ["encore/**/*.ts", "entry/**/*.ts", "stubs/**/*.ts"]
}
EOF
echo "encore.dev $(node -p 'require("./node_modules/encore.dev/package.json").version')"
npx tsc -p tsconfig.json && echo "ENCORE_TYPECHECK=pass" || echo "ENCORE_TYPECHECK=fail"
