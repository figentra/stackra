# Stackra file contract:
# Purpose: the testbed job image: Ubuntu 24.04 with mise and the repository's pins (Node, pnpm, the Infisical CLI,
#          shfmt and the Encore CLI), and Playwright's browsers with their system libraries. Every test job runs in a
#          fresh container of it as `ubuntu` (uid 1000, the host user, so a bind-mounted workspace needs no chown).
# Boundary: build recipe only. The EC2 Image Builder component `testbed-images` builds it on the box AMI from this
#           file alone (no build context), passing the ARGs from `TOOLCHAIN_PINS`; a test keeps the defaults below equal
#           to that constant. It holds no secret: Infisical tokens arrive at run time by environment. Agents never build
#           it on the Mac; CI and the image pipeline do.
# Runtime: container (linux/amd64)
# Governing contract: ADR 0484 (decision 2); ADR 0019 (exact pins); ADR 0174 (supply chain); ADR 0173.
# shortcut: the base is a tag, not a digest; pin the digest once the first image build has run and a digest can be read.
FROM ubuntu:24.04

ARG MISE_VERSION=v2026.10.0
ARG NODE_VERSION=24.22.0
ARG PNPM_VERSION=12.16.1
ARG INFISICAL_VERSION=0.44.2
ARG SHFMT_VERSION=3.14.1
ARG ENCORE_VERSION=1.58.8
ARG PLAYWRIGHT_VERSION=1.64.1

ENV DEBIAN_FRONTEND=noninteractive \
    MISE_DATA_DIR=/opt/mise \
    MISE_GLOBAL_CONFIG_FILE=/opt/mise/config.toml \
    MISE_YES=1 \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
    PATH=/opt/mise/shims:/usr/local/bin:/usr/bin:/bin

RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      build-essential ca-certificates curl docker.io git jq openssh-client python3 rsync unzip xz-utils zip \
 && rm -rf /var/lib/apt/lists/*

# mise with the repository's pins: the same Node, pnpm, Infisical CLI and shfmt as mise.toml, and the Encore CLI the
# products pin, for `encore test` (the boxes are not logged in to Encore: the agent blanks the app id).
RUN curl -fsSL https://mise.run | MISE_VERSION="${MISE_VERSION}" MISE_INSTALL_PATH=/usr/local/bin/mise sh \
 && mise use --global "node@${NODE_VERSION}" "pnpm@${PNPM_VERSION}" "github:Infisical/cli@${INFISICAL_VERSION}" \
      "shfmt@${SHFMT_VERSION}" "aqua:encoredev/encore@${ENCORE_VERSION}" \
 && mise reshim

# Playwright's browsers and their system libraries, at the catalogue's version.
RUN npx --yes "playwright@${PLAYWRIGHT_VERSION}" install --with-deps chromium \
 && chmod -R a+rX /ms-playwright /opt/mise \
 && rm -rf /var/lib/apt/lists/*

USER ubuntu
ENV HOME=/home/ubuntu
WORKDIR /work
