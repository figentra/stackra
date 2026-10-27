#!/bin/sh
# Stackra file contract:
# Purpose: the tools-photon start: on first start (no index under /photon/photon_data) import the region's
#          addresses from its Nominatim database (NOMINATIM_HOST, NOMINATIM_PASSWORD, PHOTON_LANGUAGES), then serve
#          the autocomplete API on 0.0.0.0:2322.
# Boundary: reads Nominatim's Postgres read-only; writes only its own index on the task's volume. The password
#           arrives from SSM as a variable and is never printed.
# Runtime: container (tools-photon image)
# Governing contract: owner decision R2-9 (2026-10-26); ADR 0444.
set -eu

DATA_DIR=/photon
if [ -z "$(ls -A "$DATA_DIR/photon_data" 2>/dev/null)" ]; then
  # Nominatim may still be importing: wait for its database before the one-time import.
  until java -jar /opt/photon.jar import -data-dir "$DATA_DIR" \
    -host "${NOMINATIM_HOST}" -port "${NOMINATIM_PORT:-5432}" -database "${NOMINATIM_DATABASE:-nominatim}" \
    -user "${NOMINATIM_USER:-nominatim}" -password "${NOMINATIM_PASSWORD}" \
    -languages "${PHOTON_LANGUAGES:-ar,en}"; do
    # photon_data is the volume's mount point: empty it, never remove it.
    find "$DATA_DIR/photon_data" -mindepth 1 -delete
    echo "photon: Nominatim not ready, retrying in 5 minutes" >&2
    sleep 300
  done
fi

# shortcut: no continuous updates; re-import by emptying the volume until `update` is wired to Nominatim's replication.
exec java ${JAVA_OPTS:-} -jar /opt/photon.jar serve -data-dir "$DATA_DIR" -listen-ip 0.0.0.0 -listen-port 2322
