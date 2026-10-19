---
title: Concurrent sessions
description: Several agent sessions can share one clone. Destructive commands check their own preconditions; establish whose change something is, from evidence, before acting; stage explicit file paths.
always: true
applies_to: []
manual: false
---

# Concurrent sessions

More than one session may work in this clone. They share the working tree and the git index and cannot see each
other's edits.

- **A precondition in prose is not a precondition.** A command that resets, cleans, rewrites history, force-pushes
  or deletes checks its own precondition and refuses (`git status --porcelain` non-empty is an abort). Never hand
  over a destructive command with its requirement written beside it.
- **Establish whose change it is before acting on it.** Get evidence (`git status`, `git diff`, `git log`, the
  file) before writing a sentence about who changed something. An unexplained change is a question, not a
  conclusion.
- **Stage explicit file paths.** Never `git add -A`, `git add .`, `git commit -a`, or a directory argument:
  those take another session's work into your commit. Name the files you produced.
- **The index is shared.** Run `git diff --cached --stat` before every commit and read the diff against the
  message; content that does not belong to the message does not belong in the commit.
- **A gate that fails because something it checks vanished is a signal about the tree**, never a reason to shrink
  the gate. Do not delete a check to make it pass.
- Say who decided a thing in the commit message or report; provenance cannot be rebuilt from the diff.

Enforcement: planned (a pre-commit check comparing the staged set to what the session wrote). Until then this rule
is the control.
