# Stackra file contract:
# Purpose: the recommend HTTP server of the per-region tools stack (ADR 0492 decision 8): `POST /train` takes
#          `{tenant, interactions: [{user, item, weight}]}` and fits that tenant's model (`implicit` ALS factors and an
#          item co-occurrence table); `POST /recommend` takes `{tenant, item, kind: similar|bought_together, limit}` and
#          returns `[{id, score}]`; `GET /health` answers once ready. `similar` ranks items by ALS factor cosine,
#          `bought_together` by the share of the item's buyers who also took the other item.
# Boundary: one model per tenant, kept in memory and written under MODEL_DIR/<tenant> on the task's volume, so a
#           restarted task answers without a retrain. The tenant id is checked as a folder name before it is used. It
#           keeps ids and numbers only (no name, address or text) and logs nothing from a request. Reached only inside
#           the region's VPC (no public address); `HttpRecommenderDriver` of `@stackra/search` calls it. Off by default
#           in the catalogue until a tenant's interactions pass the threshold in settings.
# Runtime: python 3.12 in the tools-recommend image
# Governing contract: ADR 0492 (decision 8); ADR 0444; ADR 0353 (residency).
import json
import os
import re
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from urllib.parse import urlparse

MODEL_DIR = Path(os.environ.get("MODEL_DIR", "/models"))
MAX_BYTES = int(os.environ.get("RECOMMEND_MAX_BYTES", str(64 * 1024 * 1024)))
MAX_LIMIT = 100
KINDS = ("similar", "bought_together")
TENANT = re.compile(r"^[A-Za-z0-9_-]{1,64}$")


class RequestInvalid(Exception):
    """A request the caller must fix; `field` names the part."""

    def __init__(self, field, message):
        super().__init__(message)
        self.field = field
        self.message = message


class UnknownItem(Exception):
    """The item is not in the tenant's model."""


def is_number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool) and value == value


def tenant_of(body):
    tenant = body.get("tenant") if isinstance(body, dict) else None
    if not isinstance(tenant, str) or TENANT.match(tenant) is None:
        raise RequestInvalid("tenant", "expected 1 to 64 letters, digits, - or _")
    return tenant


def parse_train(body):
    """The validated `(tenant, interactions)` of a train body."""
    tenant = tenant_of(body)
    rows = body.get("interactions")
    if not isinstance(rows, list) or not rows:
        raise RequestInvalid("interactions", "expected a non-empty list")
    for index, row in enumerate(rows):
        if (
            not isinstance(row, dict)
            or not isinstance(row.get("user"), str)
            or not isinstance(row.get("item"), str)
            or not row["user"]
            or not row["item"]
            or not is_number(row.get("weight"))
            or row["weight"] <= 0
        ):
            raise RequestInvalid(f"interactions[{index}]", "expected {user, item, weight > 0}")
    return tenant, rows


def parse_recommend(body):
    """The validated `(tenant, item, kind, limit)` of a recommend body."""
    tenant = tenant_of(body)
    item = body.get("item")
    if not isinstance(item, str) or not item:
        raise RequestInvalid("item", "expected a non-empty string")
    kind = body.get("kind")
    if kind not in KINDS:
        raise RequestInvalid("kind", f"expected one of {list(KINDS)}")
    limit = body.get("limit", 10)
    if not isinstance(limit, int) or isinstance(limit, bool) or not 1 <= limit <= MAX_LIMIT:
        raise RequestInvalid("limit", f"expected an integer from 1 to {MAX_LIMIT}")
    return tenant, item, kind, limit


class AlsModel:
    """One tenant's model: unit item factors from ALS and each item's co-occurrence with the others."""

    def __init__(self, items, factors, cooccurrence, counts):
        self.items = items
        self.factors = factors
        self.cooccurrence = cooccurrence
        self.counts = counts
        self.index = {item: position for position, item in enumerate(items)}

    @classmethod
    def train(cls, rows):
        import numpy as np
        from implicit.als import AlternatingLeastSquares
        from scipy.sparse import coo_matrix

        users = {}
        items = {}
        user_rows, item_cols, weights = [], [], []
        for row in rows:
            user_rows.append(users.setdefault(row["user"], len(users)))
            item_cols.append(items.setdefault(row["item"], len(items)))
            weights.append(float(row["weight"]))
        matrix = coo_matrix((weights, (user_rows, item_cols)), shape=(len(users), len(items))).tocsr()
        model = AlternatingLeastSquares(
            factors=max(1, min(64, len(items) - 1)),
            regularization=0.01,
            iterations=15,
            random_state=42,
            use_gpu=False,
            calculate_training_loss=False,
        )
        model.fit(matrix, show_progress=False)
        factors = np.asarray(model.item_factors, dtype=np.float32)
        norms = np.linalg.norm(factors, axis=1, keepdims=True)
        factors = factors / np.where(norms == 0, 1, norms)
        seen = matrix.copy()
        seen.data[:] = 1.0
        together = (seen.T @ seen).tocsr()
        counts = together.diagonal().copy()
        together.setdiag(0)
        together.eliminate_zeros()
        return cls(list(items), factors, together, counts)

    def similar(self, item, limit):
        import numpy as np

        position = self.position(item)
        scores = self.factors @ self.factors[position]
        scores[position] = -np.inf
        top = np.argsort(-scores)[:limit]
        return [{"id": self.items[i], "score": round(float(scores[i]), 6)} for i in top if scores[i] > -np.inf]

    def together(self, item, limit):
        import numpy as np

        position = self.position(item)
        row = self.cooccurrence.getrow(position)
        order = np.argsort(-row.data)[:limit]
        buyers = float(self.counts[position]) or 1.0
        return [{"id": self.items[row.indices[i]], "score": round(float(row.data[i]) / buyers, 6)} for i in order]

    def position(self, item):
        if item not in self.index:
            raise UnknownItem(item)
        return self.index[item]

    def save(self, folder):
        import numpy as np
        from scipy.sparse import save_npz

        folder.mkdir(parents=True, exist_ok=True)
        (folder / "items.json").write_text(json.dumps(self.items), encoding="utf-8")
        np.save(folder / "factors.npy", self.factors)
        np.save(folder / "counts.npy", self.counts)
        save_npz(folder / "cooccurrence.npz", self.cooccurrence)

    @classmethod
    def load(cls, folder):
        import numpy as np
        from scipy.sparse import load_npz

        items = json.loads((folder / "items.json").read_text(encoding="utf-8"))
        return cls(
            items,
            np.load(folder / "factors.npy"),
            load_npz(folder / "cooccurrence.npz").tocsr(),
            np.load(folder / "counts.npy"),
        )


class Models:
    """The tenants' models: in memory first, then the task's volume."""

    def __init__(self, directory, model_type):
        self.directory = Path(directory)
        self.model_type = model_type
        self.loaded = {}

    def train(self, tenant, rows):
        # shortcut: files are written in place, not swapped atomically; a crash mid-write is cured by a retrain.
        model = self.model_type.train(rows)
        model.save(self.directory / tenant)
        self.loaded[tenant] = model
        return len(model.items)

    def get(self, tenant):
        if tenant not in self.loaded:
            folder = self.directory / tenant
            if not folder.is_dir():
                return None
            self.loaded[tenant] = self.model_type.load(folder)
        return self.loaded[tenant]


def make_handler(models):
    """The request handler bound to `models`."""

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
                self.send(200, {"status": "ok"})
            else:
                self.send(404, {"error": "not_found"})

        def do_POST(self):
            path = urlparse(self.path).path
            if path not in ("/train", "/recommend"):
                return self.send(404, {"error": "not_found"})
            length = int(self.headers.get("Content-Length") or 0)
            if length <= 0 or length > MAX_BYTES:
                return self.send(413, {"error": "body_size", "maxBytes": MAX_BYTES})
            try:
                body = json.loads(self.rfile.read(length))
                if not isinstance(body, dict):
                    raise ValueError
            except ValueError:
                return self.send(400, {"error": "invalid_json"})
            try:
                if path == "/train":
                    tenant, rows = parse_train(body)
                    return self.send(200, {"tenant": tenant, "items": models.train(tenant, rows)})
                tenant, item, kind, limit = parse_recommend(body)
                model = models.get(tenant)
                if model is None:
                    return self.send(404, {"error": "not_trained"})
                found = model.similar(item, limit) if kind == "similar" else model.together(item, limit)
                self.send(200, found)
            except RequestInvalid as invalid:
                self.send(400, {"error": "invalid_request", "field": invalid.field, "message": invalid.message})
            except UnknownItem:
                self.send(404, {"error": "unknown_item"})

        def log_message(self, format, *args):
            pass  # no request line, no ids

    return Handler


if __name__ == "__main__":
    # shortcut: one request at a time (a train blocks recommends); every tenant's model stays in memory once loaded,
    # so size the task for the tenants it serves, or shard tenants over replicas.
    HTTPServer(("0.0.0.0", int(os.environ.get("PORT", "8080"))), make_handler(Models(MODEL_DIR, AlsModel))).serve_forever()
