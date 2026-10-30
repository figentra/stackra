# Stackra file contract:
# Purpose: the forecast HTTP server of the per-region tools stack (ADR 0492 decision 8): `POST /forecast` takes
#          `{series: [{id, timestamps, values}], horizon, frequency, models?}` and returns one
#          `{id, model, timestamps, mean, lo80, hi80}` row per series and model; `GET /health` answers once ready.
#          Nixtla StatsForecast does the work: AutoETS and AutoARIMA by default, CrostonOptimized for an intermittent
#          series (at least half of its values are zero). `frequency` is `H`, `D`, `W` or `M` (month starts).
# Boundary: stateless; keeps no series, logs no values. It takes data in and returns numbers: no business rule lives
#           here. Reached only inside the region's VPC (no public address); the owning service's scheduled job calls it
#           through `HttpForecasterDriver` of `@stackra/reports`. A model that cannot fit a series (too short, flat) is
#           left out of that series' rows rather than failing the batch.
# Runtime: python 3.12 in the tools-forecast image
# Governing contract: ADR 0492 (decision 8); ADR 0444.
import json
import os
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse

MAX_BYTES = int(os.environ.get("FORECAST_MAX_BYTES", str(32 * 1024 * 1024)))
MAX_SERIES = int(os.environ.get("FORECAST_MAX_SERIES", "5000"))
MAX_HORIZON = int(os.environ.get("FORECAST_MAX_HORIZON", "366"))
MIN_POINTS = 3
INTERMITTENT_ZERO_SHARE = 0.5

# The request's frequency to pandas' alias and the season length of that step.
FREQUENCIES = {"H": ("h", 24), "D": ("D", 7), "W": ("W", 52), "M": ("MS", 12)}
DEFAULT_MODELS = ["AutoETS", "AutoARIMA"]
INTERMITTENT_MODELS = ["CrostonOptimized"]
# Only these report a prediction interval; for the others lo80 and hi80 equal the mean.
INTERVAL_MODELS = {"AutoETS", "AutoARIMA"}
MODELS = DEFAULT_MODELS + INTERMITTENT_MODELS


class RequestInvalid(Exception):
    """A request the caller must fix; `field` names the part and `message` says why."""

    def __init__(self, field, message):
        super().__init__(message)
        self.field = field
        self.message = message


def is_number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool) and value == value


def parse(body):
    """The validated `(series, horizon, frequency, models)` of a decoded request body."""
    if not isinstance(body, dict):
        raise RequestInvalid("body", "expected an object")
    horizon = body.get("horizon")
    if not isinstance(horizon, int) or isinstance(horizon, bool) or not 1 <= horizon <= MAX_HORIZON:
        raise RequestInvalid("horizon", f"expected an integer from 1 to {MAX_HORIZON}")
    frequency = body.get("frequency")
    if frequency not in FREQUENCIES:
        raise RequestInvalid("frequency", f"expected one of {sorted(FREQUENCIES)}")
    models = body.get("models")
    if models is not None and (
        not isinstance(models, list) or not models or any(name not in MODELS for name in models)
    ):
        raise RequestInvalid("models", f"expected a non-empty list of {MODELS}")
    series = body.get("series")
    if not isinstance(series, list) or not 1 <= len(series) <= MAX_SERIES:
        raise RequestInvalid("series", f"expected 1 to {MAX_SERIES} series")
    seen = set()
    for index, item in enumerate(series):
        where = f"series[{index}]"
        if not isinstance(item, dict) or not isinstance(item.get("id"), str) or item["id"] == "":
            raise RequestInvalid(where, "expected an object with a non-empty string id")
        if item["id"] in seen:
            raise RequestInvalid(where, "duplicate id")
        seen.add(item["id"])
        stamps, values = item.get("timestamps"), item.get("values")
        if not isinstance(stamps, list) or not isinstance(values, list) or len(stamps) != len(values):
            raise RequestInvalid(where, "timestamps and values must be lists of the same length")
        if len(values) < MIN_POINTS:
            raise RequestInvalid(where, f"needs at least {MIN_POINTS} points")
        if not all(isinstance(stamp, str) for stamp in stamps) or not all(is_number(v) for v in values):
            raise RequestInvalid(where, "timestamps are ISO 8601 strings and values are finite numbers")
    return series, horizon, frequency, models


def is_intermittent(values):
    """Whether at least half of `values` are zero."""
    return sum(1 for value in values if value == 0) / len(values) >= INTERMITTENT_ZERO_SHARE


def forecast(engine, series, horizon, frequency, models):
    """The response rows: every chosen model for every series, in request order."""
    rows = []
    for item in series:
        chosen = models or (INTERMITTENT_MODELS if is_intermittent(item["values"]) else DEFAULT_MODELS)
        for model in chosen:
            try:
                result = engine.run(model, item, horizon, frequency)
            except Exception:  # a series the model cannot fit is left out, not a failed batch
                continue
            rows.append({"id": item["id"], "model": model, **result})
    return rows


class StatsEngine:
    """Nixtla StatsForecast, one model on one series per call."""

    def run(self, model, item, horizon, frequency):
        import pandas as pd
        from statsforecast import StatsForecast
        from statsforecast import models as statsmodels

        alias, season = FREQUENCIES[frequency]
        frame = pd.DataFrame(
            {"unique_id": item["id"], "ds": pd.to_datetime(item["timestamps"]), "y": item["values"]}
        )
        builders = {
            "AutoETS": lambda: statsmodels.AutoETS(season_length=season),
            "AutoARIMA": lambda: statsmodels.AutoARIMA(season_length=season),
            "CrostonOptimized": lambda: statsmodels.CrostonOptimized(),
        }
        level = [80] if model in INTERVAL_MODELS else None
        out = StatsForecast(models=[builders[model]()], freq=alias, n_jobs=1).forecast(
            df=frame, h=horizon, level=level
        )
        mean = [round(float(v), 6) for v in out[model]]
        low = [round(float(v), 6) for v in out[f"{model}-lo-80"]] if level else mean
        high = [round(float(v), 6) for v in out[f"{model}-hi-80"]] if level else mean
        return {
            "timestamps": [stamp.isoformat() for stamp in out["ds"]],
            "mean": mean,
            "lo80": low,
            "hi80": high,
        }


def make_handler(engine):
    """The request handler bound to an `engine`."""

    class Handler(BaseHTTPRequestHandler):
        def send(self, status, body):
            payload = json.dumps(body).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)

        def do_GET(self):
            if urlparse(self.path).path == "/health":
                self.send(200, {"status": "ok", "models": MODELS})
            else:
                self.send(404, {"error": "not_found"})

        def do_POST(self):
            if urlparse(self.path).path != "/forecast":
                return self.send(404, {"error": "not_found"})
            length = int(self.headers.get("Content-Length") or 0)
            if length <= 0 or length > MAX_BYTES:
                return self.send(413, {"error": "body_size", "maxBytes": MAX_BYTES})
            try:
                body = json.loads(self.rfile.read(length))
            except ValueError:
                return self.send(400, {"error": "invalid_json"})
            try:
                series, horizon, frequency, models = parse(body)
            except RequestInvalid as invalid:
                return self.send(400, {"error": "invalid_request", "field": invalid.field, "message": invalid.message})
            self.send(200, forecast(engine, series, horizon, frequency, models))

        def log_message(self, format, *args):
            pass  # no request line, no values

    return Handler


if __name__ == "__main__":
    # shortcut: one request at a time and one StatsForecast call per series and model; scale with replicas, and batch
    # same-length series into one frame when a nightly run needs the speed.
    HTTPServer(("0.0.0.0", int(os.environ.get("PORT", "8080"))), make_handler(StatsEngine())).serve_forever()
