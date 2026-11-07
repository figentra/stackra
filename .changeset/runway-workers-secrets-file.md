---
"@stackra/runway": patch
---

The Cloudflare Workers provider hands secrets to `wrangler versions upload` in a 0600 file in a fresh temporary
folder, removed right after the upload, instead of `--secrets-file /dev/stdin`, which wrangler can't open when stdin
is a socket (Linux CI runners, ENXIO).
