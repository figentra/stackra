# Stackra file contract:
# Purpose: tests of the recommend server with a stub model type: a train then `similar` and `bought_together`
#          recommendations per tenant, a tenant's model surviving a restart from the volume, tenants staying apart,
#          and the validation errors (tenant name, interactions, kind, limit, unknown item, not trained). No ALS runs.
# Boundary: test only; run with `python -m pytest images/recommend/__tests__` in the image's build context (CI).
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


class StubModel:
    """Items in first-seen order; `similar` is the next items, `together` the previous ones."""

    def __init__(self, items):
        self.items = items

    @classmethod
    def train(cls, rows):
        return cls(list(dict.fromkeys(row["item"] for row in rows)))

    def save(self, folder):
        folder.mkdir(parents=True, exist_ok=True)
        (folder / "items.json").write_text(json.dumps(self.items), encoding="utf-8")

    @classmethod
    def load(cls, folder):
        return cls(json.loads((folder / "items.json").read_text(encoding="utf-8")))

    def position(self, item):
        if item not in self.items:
            raise server.UnknownItem(item)
        return self.items.index(item)

    def similar(self, item, limit):
        at = self.position(item)
        return [{"id": other, "score": 0.5} for other in self.items[at + 1 :][:limit]]

    def together(self, item, limit):
        at = self.position(item)
        return [{"id": other, "score": 0.25} for other in self.items[:at][:limit]]


def serve(directory):
    httpd = HTTPServer(("127.0.0.1", 0), server.make_handler(server.Models(directory, StubModel)))
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd


def call(httpd, method, path, body=None):
    connection = HTTPConnection("127.0.0.1", httpd.server_address[1])
    payload = body if isinstance(body, (bytes, type(None))) else json.dumps(body).encode()
    connection.request(method, path, body=payload, headers={"Content-Type": "application/json"} if payload else {})
    response = connection.getresponse()
    return response.status, json.loads(response.read())


def interactions(*items):
    return [{"user": "u1", "item": item, "weight": 1} for item in items]


def test_trains_per_tenant_and_recommends(tmp_path):
    httpd = serve(tmp_path)
    assert call(httpd, "POST", "/train", {"tenant": "acme", "interactions": interactions("a", "b", "c")}) == (
        200,
        {"tenant": "acme", "items": 3},
    )
    assert call(httpd, "POST", "/recommend", {"tenant": "acme", "item": "a", "kind": "similar", "limit": 1}) == (
        200,
        [{"id": "b", "score": 0.5}],
    )
    assert call(httpd, "POST", "/recommend", {"tenant": "acme", "item": "c", "kind": "bought_together"})[1] == [
        {"id": "a", "score": 0.25},
        {"id": "b", "score": 0.25},
    ]
    call(httpd, "POST", "/train", {"tenant": "other", "interactions": interactions("x")})
    assert call(httpd, "POST", "/recommend", {"tenant": "other", "item": "a", "kind": "similar"}) == (
        404,
        {"error": "unknown_item"},
    )
    httpd.shutdown()


def test_a_restarted_task_answers_from_the_volume(tmp_path):
    first = serve(tmp_path)
    call(first, "POST", "/train", {"tenant": "acme", "interactions": interactions("a", "b")})
    first.shutdown()
    second = serve(tmp_path)
    assert call(second, "POST", "/recommend", {"tenant": "acme", "item": "a", "kind": "similar"})[0] == 200
    assert call(second, "POST", "/recommend", {"tenant": "nobody", "item": "a", "kind": "similar"}) == (
        404,
        {"error": "not_trained"},
    )
    second.shutdown()


def test_refuses_bad_requests(tmp_path):
    httpd = serve(tmp_path)
    good = {"tenant": "acme", "item": "a", "kind": "similar", "limit": 5}
    for change, field in [
        ({"tenant": "../etc"}, "tenant"),
        ({"tenant": ""}, "tenant"),
        ({"item": ""}, "item"),
        ({"kind": "popular"}, "kind"),
        ({"limit": 0}, "limit"),
        ({"limit": 101}, "limit"),
    ]:
        status, body = call(httpd, "POST", "/recommend", {**good, **change})
        assert (status, body["field"]) == (400, field), change
    for rows, field in [
        ([], "interactions"),
        ([{"user": "u", "item": "i", "weight": 0}], "interactions[0]"),
        ([{"user": "", "item": "i", "weight": 1}], "interactions[0]"),
        ([{"user": "u", "item": "i"}], "interactions[0]"),
    ]:
        status, body = call(httpd, "POST", "/train", {"tenant": "acme", "interactions": rows})
        assert (status, body["field"]) == (400, field), rows
    assert call(httpd, "POST", "/train", b"[]")[0] == 400
    assert call(httpd, "POST", "/nope", b"{}")[0] == 404
    assert call(httpd, "GET", "/health")[1] == {"status": "ok"}
    httpd.shutdown()
