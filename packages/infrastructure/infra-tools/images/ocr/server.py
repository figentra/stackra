# Stackra file contract:
# Purpose: the OCR HTTP server of the per-region tools stack (owner decision R2-5): `POST /ocr` takes one image or PDF
#          as the raw request body (`?lang=ar` picks a language from OCR_LANGUAGES, the first by default) and returns
#          `{engine, lines: [{text, confidence, box}], text}`; `GET /health` answers once the models are loaded.
#          The engine (PaddleOCR or Surya) is baked into the image by the ENGINE build argument.
# Boundary: stateless; keeps no document, logs no content. Reached only inside the region's VPC (no public address);
#           OS integrations calls it through the managed Connection at the endpoint the plan derives.
# Runtime: python 3.12 in the tools-ocr image
# Governing contract: owner decision R2-5 (2026-10-26); ADR 0444.
import json
import os
import tempfile
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import parse_qs, urlparse

ENGINE = os.environ.get("OCR_ENGINE", "paddleocr")
LANGUAGES = [code.strip() for code in os.environ.get("OCR_LANGUAGES", "ar,en").split(",") if code.strip()]
MAX_BYTES = int(os.environ.get("OCR_MAX_BYTES", str(25 * 1024 * 1024)))
SUFFIXES = {
    "application/pdf": ".pdf",
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/tiff": ".tiff",
    "image/webp": ".webp",
}


def line(text, confidence, box):
    """One recognised line in the response shape."""
    return {"text": text, "confidence": round(float(confidence), 4), "box": [round(float(v), 1) for v in box]}


def respond(lines):
    """The response body for the recognised `lines`."""
    return {"engine": ENGINE, "lines": lines, "text": "\n".join(item["text"] for item in lines)}


class PaddleEngine:
    """PaddleOCR 3.x, one pipeline per language."""

    def __init__(self, languages):
        from paddleocr import PaddleOCR

        self.pipelines = {
            code: PaddleOCR(
                lang=code,
                use_doc_orientation_classify=False,
                use_doc_unwarping=False,
                use_textline_orientation=False,
            )
            for code in languages
        }

    def read(self, path, language):
        lines = []
        for page in self.pipelines[language].predict(path):
            data = page.json
            data = data.get("res", data)
            for text, score, box in zip(data["rec_texts"], data["rec_scores"], data["rec_boxes"]):
                lines.append(line(text, score, box))
        return lines


class SuryaEngine:
    """Surya, all languages in one model; images only."""

    def __init__(self, languages):
        from surya.detection import DetectionPredictor
        from surya.foundation import FoundationPredictor
        from surya.recognition import RecognitionPredictor

        self.detection = DetectionPredictor()
        self.recognition = RecognitionPredictor(FoundationPredictor())

    def read(self, path, language):
        from PIL import Image

        with Image.open(path) as image:
            [prediction] = self.recognition([image.convert("RGB")], det_predictor=self.detection)
        return [line(item.text, item.confidence, item.bbox) for item in prediction.text_lines]


def load_engine():
    return SuryaEngine(LANGUAGES) if ENGINE == "surya" else PaddleEngine(LANGUAGES)


def make_handler(engine):
    """The request handler bound to a loaded `engine`."""

    class Handler(BaseHTTPRequestHandler):
        def send(self, status, body):
            payload = json.dumps(body, ensure_ascii=False).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)

        def do_GET(self):
            if urlparse(self.path).path == "/health":
                self.send(200, {"status": "ok", "engine": ENGINE, "languages": LANGUAGES})
            else:
                self.send(404, {"error": "not_found"})

        def do_POST(self):
            url = urlparse(self.path)
            if url.path != "/ocr":
                return self.send(404, {"error": "not_found"})
            suffix = SUFFIXES.get(self.headers.get("Content-Type", "").split(";")[0].strip())
            if suffix is None:
                return self.send(415, {"error": "unsupported_media_type", "accepted": sorted(SUFFIXES)})
            length = int(self.headers.get("Content-Length") or 0)
            if length <= 0 or length > MAX_BYTES:
                return self.send(413, {"error": "body_size", "maxBytes": MAX_BYTES})
            language = parse_qs(url.query).get("lang", [LANGUAGES[0]])[0]
            if language not in LANGUAGES:
                return self.send(400, {"error": "unsupported_language", "languages": LANGUAGES})
            with tempfile.NamedTemporaryFile(suffix=suffix) as upload:
                upload.write(self.rfile.read(length))
                upload.flush()
                try:
                    lines = engine.read(upload.name, language)
                except Exception as error:  # the engine's own failure is the caller's unreadable document
                    return self.send(422, {"error": "unreadable_document", "detail": type(error).__name__})
            self.send(200, respond(lines))

        def log_message(self, format, *args):
            pass  # no request line: a query string may carry a document reference

    return Handler


if __name__ == "__main__":
    # shortcut: one request at a time (the models are not thread-safe); scale with replicas, not threads.
    HTTPServer(("0.0.0.0", int(os.environ.get("PORT", "8080"))), make_handler(load_engine())).serve_forever()
