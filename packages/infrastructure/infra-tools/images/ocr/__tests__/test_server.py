# Stackra file contract:
# Purpose: tests of the OCR server with a stub engine: the response shape, the media type, size and language checks,
#          and an engine failure mapped to 422. No model is loaded.
# Boundary: test only; run with `python -m pytest images/ocr/__tests__` in the image's build context (CI).
# Runtime: python 3.12 (pytest)
# Governing contract: ADR 0022 (test placement); ADR 0444.
import json
import sys
import threading
from http.client import HTTPConnection
from http.server import HTTPServer
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import server  # noqa: E402


class StubEngine:
    def read(self, path, language):
        if Path(path).read_bytes() == b"broken":
            raise ValueError("bad image")
        return [server.line("مرحبا", 0.98765, [1, 2, 3, 4]), server.line("hello", 0.5, [5, 6, 7, 8])]


def serve():
    httpd = HTTPServer(("127.0.0.1", 0), server.make_handler(StubEngine()))
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd


def call(httpd, method, path, body=None, content_type="image/png"):
    connection = HTTPConnection("127.0.0.1", httpd.server_address[1])
    connection.request(method, path, body=body, headers={"Content-Type": content_type} if body is not None else {})
    response = connection.getresponse()
    return response.status, json.loads(response.read())


def test_reads_lines_and_joins_text():
    httpd = serve()
    status, body = call(httpd, "POST", "/ocr?lang=ar", b"image")
    assert status == 200
    assert body["lines"][0] == {"text": "مرحبا", "confidence": 0.9877, "box": [1.0, 2.0, 3.0, 4.0]}
    assert body["text"] == "مرحبا\nhello"
    httpd.shutdown()


def test_refuses_bad_requests():
    httpd = serve()
    assert call(httpd, "POST", "/ocr", b"x", "text/plain")[0] == 415
    assert call(httpd, "POST", "/ocr?lang=xx", b"x")[0] == 400
    assert call(httpd, "POST", "/ocr", b"broken")[0] == 422
    assert call(httpd, "GET", "/health")[1]["status"] == "ok"
    httpd.shutdown()
