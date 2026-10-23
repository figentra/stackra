# src/modules

One folder per feature module, `src/modules/<key>/`, holding `<key>.module.ts` (a class that extends `Module`, with
`exports` only); the root module `src/{{NAME}}.module.ts` lists it in `imports`. The module key is the folder name in
snake_case. A new service has none.

Inside a module each kind suffix has one home group, and a group folder appears with its first file (ADR 0294
decision 13):

| Group                  | Holds                                                                                     |
| ---------------------- | ----------------------------------------------------------------------------------------- |
| (root)                 | `<key>.module.ts`, `<key>.settings.ts` (one settings group), `README.md`                  |
| `models/`              | `.model.ts`, `.state-machine.ts`, `.bucket.ts`, `.projection.ts`                          |
| `actions/`             | `.action.ts`                                                                              |
| `queries/`             | `.query.ts`                                                                               |
| `schemas/`             | `.schema.ts` (shared by two or more files), `.change.ts` (dated response changes)         |
| `enums/`               | `.enum.ts`                                                                                |
| `errors/`              | `.error.ts`                                                                               |
| `events/`              | `.event.ts`, `.change.ts` (event versions)                                                |
| `listeners/`           | `.listener.ts`                                                                            |
| `workflows/`           | `.workflow.ts`, `.signal.ts`                                                              |
| `access/`              | `.permissions.ts`, `.policy.ts`, `.role.ts`, `.entitlement.ts`, `.precondition.ts`, `.flag.ts` |
| `services/`            | `.service.ts`, `.repository.ts` (only for named reads beyond `CrudService`)               |
| `drivers/`             | `.driver.ts`                                                                              |
| `extensions/`          | `.extension-point.ts`, `.extension.ts`, `.interceptor.ts`                                 |
| `raw/`                 | `.controller.ts`: `/api/auth/*` and streams only                                          |
| `resources/<model>/`   | `.resource.ts`, `.widget.ts`, `.document.ts`, `.notification.ts`, `.mail.tsx`             |
| `database/migrations/` | `NNNN-<name>.migration.ts`, numbered per module, changing only the module's schema        |
| `database/factories/`  | `<model>.factory.ts`                                                                      |
| `database/seeders/`    | `minimal.seeder.ts`, `demo.seeder.ts`, `test.seeder.ts`                                   |
| `ai/`                  | `.prompt.ts`, `.skill.ts`, `.facts.ts`                                                    |
| `functions/`           | `.function.ts`                                                                            |
| `constants/`           | `.constant.ts`                                                                            |
| `types/`               | `.type.ts`                                                                                |

A file is `<name>.<kind>.ts`, and its class is `PascalCase(name) + PascalCase(kind)` extending the kind's base class
(`extends Action({ key })`, `extends CrudService(Order)`); no kind decorator. Gen finds every binding by its base class
and writes the wiring, so a module lists no providers. A sibling module is imported only through its exported classes
and public groups, as `#modules/<key>/<group>/…`. Tests sit in `__tests__/<name>.<kind>.test.ts` beside their subject.

No `controllers/`, `dtos/`, `repositories/`, `guards/`, `links/`, `permissions/`, `policies/`, `states/`, `hooks/`,
`seeds/`, `utils/` or `helpers/` folder.
