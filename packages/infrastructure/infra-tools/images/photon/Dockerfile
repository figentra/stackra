# Stackra file contract:
# Purpose: the tools-photon image: komoot's Photon release jar (Apache-2.0) on Java 21 with entrypoint.sh, published
#          as ghcr.io/figentra/tools-photon:<photon version>.
# Boundary: build recipe only; CI builds and publishes it (integration ask), agents never build on the Mac. The jar is
#           downloaded from the pinned GitHub release and checked against PHOTON_SHA256 when the build passes one.
# Runtime: container (linux/amd64)
# Governing contract: owner decision R2-9 (2026-10-26); ADR 0444.
FROM eclipse-temurin:21.0.8_9-jre-noble

ARG PHOTON_VERSION=1.3.0
ARG PHOTON_SHA256=""
ADD https://github.com/komoot/photon/releases/download/${PHOTON_VERSION}/photon-${PHOTON_VERSION}.jar /opt/photon.jar
RUN if [ -n "$PHOTON_SHA256" ]; then echo "$PHOTON_SHA256  /opt/photon.jar" | sha256sum -c -; fi \
 && chmod 0444 /opt/photon.jar \
 && useradd --create-home --uid 10001 photon \
 && mkdir -p /photon/photon_data \
 && chown -R photon /photon

COPY --chmod=0555 entrypoint.sh /usr/local/bin/photon-entrypoint
USER photon
WORKDIR /photon
EXPOSE 2322
ENTRYPOINT ["/usr/local/bin/photon-entrypoint"]
