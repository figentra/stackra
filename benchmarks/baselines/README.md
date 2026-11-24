# `baselines/`

One script per framework, `<framework>.mjs`, that creates the framework's official starter at a pinned version in a
directory it is given. The pinned version is written in the script and echoed into every run record as
`frameworkVersion`.

Order: Stackra, NestJS and Express first (Node only). Frameworks that need JDK, .NET, Ruby, Python or PHP run only
inside containers, one at a time, and only when the box has room; until then they are listed as waiting in the
hand-over.
