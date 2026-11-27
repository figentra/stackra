---
"@stackra/cli": minor
"@stackra/console": patch
---

Stackra supports macOS, Linux and Windows through WSL 2, and says so (STA-2899). `stackra doctor`, the quick check of
`stackra dev` and the machine check `stackra create` runs now open with a "supported system" line: a warning on native
Windows (run `wsl --install` and work inside the distribution) and on WSL 1 (`wsl --set-version <distribution> 2`),
never a failure. The two process runners, `runProcess` in `@stackra/cli` and `NodeProcessRunnerDriver` in
`@stackra/console`, start tools through cross-spawn, so on Windows a `.cmd` shim such as `pnpm.cmd` starts by its bare
name with every argument escaped for cmd.exe, instead of `stackra create` failing at "Installing with pnpm" with exit
127; elsewhere nothing changes. `runProcess` leaves one `PATH` key (Windows spells it `Path`), so the
`node_modules/.bin` folders still come first. `stackra new` writes a `clean` script that runs under any shell (`node -e`
with `rmSync`, no `rm -rf`), the scaffold formats through cross-spawn, and `stackra-console create` installs through the
process port.
