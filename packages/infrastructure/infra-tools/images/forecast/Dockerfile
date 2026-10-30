# Stackra file contract:
# Purpose: the tools-forecast image: server.py on Python 3.12 with Nixtla StatsForecast, published as
#          ghcr.io/figentra/tools-forecast:<version>.
# Boundary: build recipe only; CI builds and publishes it, agents never build on the Mac. Licences: StatsForecast
#           Apache-2.0; the Python base image is PSF. No model weights: StatsForecast fits each series at request time.
#           shortcut: only the direct packages are pinned; CI should add a hashed constraints file once it builds this.
# Runtime: container (linux/amd64)
# Governing contract: ADR 0492 (decision 8); ADR 0444.
FROM python:3.12.11-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8080

RUN apt-get update \
 && apt-get install -y --no-install-recommends libgomp1 \
 && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir statsforecast==2.1.1

RUN useradd --create-home --uid 10001 forecast
USER forecast
WORKDIR /home/forecast
COPY --chown=forecast server.py .

EXPOSE 8080
CMD ["python", "server.py"]
