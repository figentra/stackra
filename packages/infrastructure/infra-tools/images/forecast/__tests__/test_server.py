# Stackra file contract:
# Purpose: tests of the forecast server with a stub engine: the response shape, the default models (AutoETS and
#          AutoARIMA, Croston for an intermittent series), explicit models, a model that fails on one series being left
#          out, and the validation of the horizon, frequency, models and series. No StatsForecast is loaded.
# Boundary: test only; run with `python -m pytest images/forecast/__tests__` in the image's build context (CI).
# Runtime: python 3.12 (pytest)
# Governing contract: ADR 0022 (test placement); ADR 0492 (decision 8).
import json
import sys
import threading
from http.client import HTTPConnection
from http.server import HTTPServer
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import server  # noqa: E402


class StubEngine:
    def run(self, model, item, horizon, frequency):
        if item["id"] == "short" and model == "AutoARIMA":
            raise ValueError("cannot fit")
        stamps = [f"2026-11-{day:02d}T00:00:00" for day in range(1, horizon + 1)]
        mean = [float(len(item["values"]))] * horizon
        return {"timestamps": stamps, "mean": mean, "lo80": mean, "hi80": mean}


def serve():
    httpd = HTTPServer(("127.0.0.1", 0), server.make_handler(StubEngine()))
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd


def call(httpd, method, path, body=None):
    connection = HTTPConnection("127.0.0.1", httpd.server_address[1])
    payload = body if isinstance(body, (bytes, type(None))) else json.dumps(body).encode()
    connection.request(method, path, body=payload, headers={"Content-Type": "application/json"} if payload else {})
    response = connection.getresponse()
    return response.status, json.loads(response.read())


def series(identifier, values):
    return {"id": identifier, "timestamps": [f"2026-10-{i + 1:02d}" for i in range(len(values))], "values": values}


def test_defaults_and_intermittent_series():
    httpd = serve()
    status, rows = call(
        httpd,
        "POST",
        "/forecast",
        {"series": [series("steady", [5, 6, 7, 8]), series("sparse", [0, 0, 3, 0])], "horizon": 2, "frequency": "D"},
    )
    assert status == 200
    assert [(row["id"], row["model"]) for row in rows] == [
        ("steady", "AutoETS"),
        ("steady", "AutoARIMA"),
        ("sparse", "CrostonOptimized"),
    ]
    assert set(rows[0]) == {"id", "model", "timestamps", "mean", "lo80", "hi80"}
    assert len(rows[0]["mean"]) == 2
    httpd.shutdown()


def test_explicit_models_and_a_model_that_cannot_fit_is_left_out():
    httpd = serve()
    body = {"series": [series("short", [1, 2, 3])], "horizon": 1, "frequency": "W", "models": ["AutoETS", "AutoARIMA"]}
    status, rows = call(httpd, "POST", "/forecast", body)
    assert status == 200
    assert [row["model"] for row in rows] == ["AutoETS"]
    httpd.shutdown()


def test_refuses_bad_requests():
    httpd = serve()
    good = {"series": [series("a", [1, 2, 3])], "horizon": 1, "frequency": "D"}
    for change, field in [
        ({"horizon": 0}, "horizon"),
        ({"horizon": 100000}, "horizon"),
        ({"frequency": "Q"}, "frequency"),
        ({"models": ["Prophet"]}, "models"),
        ({"series": []}, "series"),
        ({"series": [series("a", [1, 2])]}, "series[0]"),
        ({"series": [series("a", [1, 2, 3]), series("a", [1, 2, 3])]}, "series[1]"),
        ({"series": [{"id": "a", "timestamps": ["x", "y", "z"], "values": [1, "2", 3]}]}, "series[0]"),
    ]:
        status, body = call(httpd, "POST", "/forecast", {**good, **change})
        assert (status, body["field"]) == (400, field), change
    assert call(httpd, "POST", "/forecast", b"{")[0] == 400
    assert call(httpd, "POST", "/nope", b"{}")[0] == 404
    assert call(httpd, "GET", "/health")[1]["status"] == "ok"
    httpd.shutdown()
