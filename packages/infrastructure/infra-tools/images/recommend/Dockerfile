# Stackra file contract:
# Purpose: the tools-recommend image: server.py on Python 3.12 with `implicit` ALS, published as
#          ghcr.io/figentra/tools-recommend:<version>.
# Boundary: build recipe only; CI builds and publishes it, agents never build on the Mac. Licences: implicit MIT; numpy
#           and scipy BSD-3-Clause. CPU only (`use_gpu=False`). Models are written under /models, the task's volume
#           (the catalogue mounts it from EFS). shortcut: only the direct packages are pinned and there is no build
#           workflow yet; a hashed constraints file is STA-1658, the image build and push workflow STA-1659.
# Runtime: container (linux/amd64)
# Governing contract: ADR 0492 (decision 8); ADR 0444.
FROM python:3.12.11-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8080 \
    MODEL_DIR=/models

RUN apt-get update \
 && apt-get install -y --no-install-recommends libgomp1 \
 && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir implicit==0.7.3

RUN useradd --create-home --uid 10001 recommend
USER recommend
WORKDIR /home/recommend
COPY --chown=recommend server.py .

EXPOSE 8080
CMD ["python", "server.py"]
