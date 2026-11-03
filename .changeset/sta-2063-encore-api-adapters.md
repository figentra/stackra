---
"@stackra/gen": minor
---

A service's generated Encore app gains its service declaration and its endpoints. Every service gets
`.stackra/encore/<member>/encore.service.ts` (`export default new Service("<member>")`), and a service with an own
action or query that has an endpoint gets `.stackra/encore/<member>/api.ts`: one `api()` per such entry, with its
derived method and path, typed by its input and output schemas, running the call through
`ActionPipeline.execute` inside `app.handlers.run`.

The actor comes only from Encore's verified auth data (`getAuthData()` of `~encore/auth`, `{ userID, actor }`). An
endpoint is `auth: true` unless its call lists `ActorKind.Anonymous` in `actors`; that one is `auth: false` and runs as
an anonymous actor when no session is presented. The auth handler that returns the auth data comes with the generated
gateway; until then `encore build` refuses the `auth: true` endpoints. A hosted package's entry, and one whose schema
the member does not declare, get no endpoint yet. Gen now refuses a route whose path parameter is no field of the
input (`endpoint_param_unbound`), since Encore binds path parameters from the input.
