# Getting help

Stackra is maintained by a small team at Figentra. Support here is best effort: there is no
response-time promise for issues.

## Where to go

| You want to                                      | Go to                                                                                                                                |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| Learn how something works                        | The [documentation](https://docs.stackra.figentra.com), starting with the [quickstart](https://docs.stackra.figentra.com/quickstart) |
| Report a bug                                     | A [bug report](https://github.com/stackra-inc/stackra/issues/new?template=bug-report.yml)                                            |
| Report wrong or missing documentation            | A [documentation report](https://github.com/stackra-inc/stackra/issues/new?template=documentation.yml)                               |
| Ask for a feature or a change in behaviour       | A [feature request](https://github.com/stackra-inc/stackra/issues/new?template=feature-request.yml)                                  |
| Ask a usage question the docs do not answer      | A [question](https://github.com/stackra-inc/stackra/issues/new?template=question.yml)                                                |
| Report a security vulnerability                  | Privately, never in an issue: see [`SECURITY.md`](../SECURITY.md)                                                                    |
| Report behaviour that breaks the code of conduct | Privately: see [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md#reporting)                                                                  |
| Contribute a fix or a feature                    | [`CONTRIBUTING.md`](../CONTRIBUTING.md)                                                                                              |

Search the [existing issues](https://github.com/stackra-inc/stackra/issues?q=is%3Aissue) first; a
thumbs-up on an existing issue helps more than a duplicate.

## What helps us help you

- The `@stackra/*` versions you use (`pnpm why @stackra/<name>` or `npm ls @stackra/<name>`), your
  Node.js version and your operating system.
- The smallest set of steps or a small repository that shows the problem.
- The full error output, as text rather than a screenshot.
- Never a secret value (a key, token, password or `.env` contents). Name the secret instead.

## Versions that get fixes

Every `@stackra/*` package (and `@stackra-pro/*`) is released at the same version, from `main` only.
A fix ships as the next release; there are no maintenance branches, so an older version gets no
back-ported fix and the way to get one is to upgrade to the latest release. Before 1.0, a minor
release can contain breaking changes, each with a written release note. A formal support window and
response times are not decided yet; the
[support and versioning page](https://docs.stackra.figentra.com/customers/support) says what is.

## Stackra Pro

`@stackra-pro/*` packages need a licence token to install; the
[install page](https://docs.stackra.figentra.com/customers/install) covers tokens. Bugs in a Pro
package can be reported here like any other, as long as the report holds no licence token and no
private code.
