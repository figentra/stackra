# Stackra file contract:
# Purpose: the tools-speech image: server.py and audio.py on Python 3.12 with faster-whisper `large-v3` on a GPU,
#          published as ghcr.io/figentra/tools-speech:<version>.
# Boundary: build recipe only; CI builds and publishes it, agents never build on the Mac. Licences: faster-whisper MIT,
#           CTranslate2 MIT, aiohttp Apache-2.0, numpy BSD-3-Clause; the model Systran/faster-whisper-large-v3 (a
#           conversion of OpenAI Whisper large-v3) is MIT. The NVIDIA cuBLAS and cuDNN wheels carry NVIDIA's licence.
#           The model is baked in at the pinned revision so a task never downloads weights or reaches the internet at
#           start; the container writes nothing at run time. shortcut: only the direct packages are pinned; CI should add
#           a hashed constraints file once it builds this.
# Runtime: container (linux/amd64, NVIDIA GPU, ECS GPU-optimised host)
# Governing contract: ADR 0492 (decisions 8 and 9); ADR 0444; contracts/tools-speech.md of the sta-1629 spec.
FROM python:3.12.11-slim-bookworm

ARG MODEL_REVISION=edaa852ec7e145841d8ffdb056a99866b5f0a478
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8080 \
    MODEL_PATH=/models/large-v3 \
    HF_HUB_OFFLINE=1 \
    LD_LIBRARY_PATH=/usr/local/lib/python3.12/site-packages/nvidia/cublas/lib:/usr/local/lib/python3.12/site-packages/nvidia/cudnn/lib

RUN pip install --no-cache-dir \
      faster-whisper==1.2.1 \
      ctranslate2==4.8.2 \
      numpy==2.5.4 \
      aiohttp==3.14.5 \
      nvidia-cublas-cu12==12.9.2.10 \
      nvidia-cudnn-cu12==9.27.0.42

RUN HF_HUB_OFFLINE=0 python -c "from huggingface_hub import snapshot_download; snapshot_download('Systran/faster-whisper-large-v3', revision='${MODEL_REVISION}', local_dir='/models/large-v3')"

RUN useradd --create-home --uid 10001 speech
USER speech
WORKDIR /home/speech
COPY --chown=speech server.py audio.py ./

EXPOSE 8080
CMD ["python", "server.py"]
