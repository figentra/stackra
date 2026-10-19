import { test } from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync, verify } from "node:crypto";
import { appJwt, mintToken } from "../bot-token.mjs";

const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const pem = privateKey.export({ type: "pkcs8", format: "pem" });

test("appJwt is a valid RS256 JWT with iat-60, exp+9m and iss", () => {
  const jwt = appJwt(5386128, pem, 1_000_000);
  const [head, body, sig] = jwt.split(".");
  assert.deepEqual(JSON.parse(Buffer.from(head, "base64url")), { alg: "RS256", typ: "JWT" });
  assert.deepEqual(JSON.parse(Buffer.from(body, "base64url")), {
    iat: 999_940,
    exp: 1_000_540,
    iss: "5386128",
  });
  assert.ok(
    verify("RSA-SHA256", Buffer.from(`${head}.${body}`), publicKey, Buffer.from(sig, "base64url")),
  );
});

test("appJwt accepts a PEM stored with escaped newlines", () => {
  assert.equal(appJwt(1, pem.replace(/\n/g, "\\n"), 5).split(".").length, 3);
});

const env = {
  STACKRA_BOT_APP_ID: "5386128",
  STACKRA_BOT_INSTALLATION_ID: "173153517",
  STACKRA_BOT_PRIVATE_KEY: pem,
};

test("mintToken posts the JWT to the installation endpoint and returns the token", async () => {
  let call;
  const fetchMock = async (url, init) => {
    call = { url, init };
    return { ok: true, status: 201, json: async () => ({ token: "ghs_test" }) };
  };
  assert.equal(await mintToken(env, fetchMock), "ghs_test");
  assert.equal(call.url, "https://api.github.com/app/installations/173153517/access_tokens");
  assert.equal(call.init.method, "POST");
  assert.match(call.init.headers.Authorization, /^Bearer [\w-]+\.[\w-]+\.[\w-]+$/);
});

const fail = async () => ({
  ok: false,
  status: 401,
  json: async () => ({ message: "Bad credentials" }),
});

test("mintToken errors name the problem, never the key", async () => {
  await assert.rejects(mintToken(env, fail), (error) => {
    assert.equal(error.message, "GitHub returned 401: Bad credentials");
    return true;
  });
  await assert.rejects(mintToken({}, fail), /missing env: STACKRA_BOT_APP_ID/);
  await assert.rejects(mintToken({ ...env, STACKRA_BOT_PRIVATE_KEY: "nope" }, fail), (error) => {
    assert.ok(!error.message.includes("nope"));
    return true;
  });
});
