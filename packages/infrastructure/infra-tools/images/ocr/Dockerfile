# Stackra file contract:
# Purpose: the tools-ocr image: server.py on Python 3.12 with one OCR engine, chosen at build time
#          (`--build-arg ENGINE=paddleocr|surya`) and published as ghcr.io/figentra/tools-ocr:<version>-<engine>.
# Boundary: build recipe only; CI builds and publishes it (integration ask), agents never build on the Mac.
#           Models download on first start into the container. PaddleOCR is Apache-2.0; Surya's code is GPL-3.0 and
#           its weights carry a modified AI Pubs Open Rail-M licence (free under USD 2M funding or revenue).
# Runtime: container (linux/amd64)
# Governing contract: owner decision R2-5 (2026-10-26); ADR 0444.
FROM python:3.12.11-slim-bookworm

ARG ENGINE=paddleocr
ENV OCR_ENGINE=${ENGINE} \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8080

RUN apt-get update \
 && apt-get install -y --no-install-recommends libgl1 libglib2.0-0 libgomp1 \
 && rm -rf /var/lib/apt/lists/*

RUN if [ "$ENGINE" = "surya" ]; then \
      pip install --no-cache-dir surya-ocr==0.17.1; \
    else \
      pip install --no-cache-dir paddlepaddle==3.3.1 paddleocr==3.7.0; \
    fi

RUN useradd --create-home --uid 10001 ocr
USER ocr
WORKDIR /home/ocr
COPY --chown=ocr server.py .

EXPOSE 8080
CMD ["python", "server.py"]
