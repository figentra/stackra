---
"@stackra/cli": patch
---

`stackra testbed run` runs the job detached on the box and follows its log, so a dropped SSH-over-SSM connection no
longer kills a long job: it reattaches up to three times and takes the exit code from the box. Ctrl-C stops the job on
the box. SSH keepalives notice a dead session in two minutes. `--postgres` asks the box for a throwaway Postgres. The default regions are eu-west-1, eu-west-2 and
eu-central-1; us-east-1 joins once box 1 stops.
