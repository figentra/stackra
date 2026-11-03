---
"@stackra/gen": patch
---

Gen writes `.stackra/gen/ui.ts` (`#stackra/ui`) for a member that declares `@stackra/ui`: it re-exports `Component`
from `@stackra/ui/native` on an app that renders only on iOS and Android, and from `@stackra/ui/react` otherwise. A
class component (`class Greeting extends Component<GreetingProps>`) now type-checks; the class-components compiler
still removes the import before a bundle loads it. The `.` entry exports the emitter as `emitUiFacade`.
