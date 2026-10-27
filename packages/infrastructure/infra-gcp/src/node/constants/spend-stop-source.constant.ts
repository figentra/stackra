/**
 * Stackra file contract:
 * Purpose: `SPEND_STOP_SOURCE`, the source of the Cloud Function that stops a non-production project's spend: on each
 *          budget notification it compares the cost with `STOP_AT_PERCENT` of the budget and, once reached, detaches
 *          the project `PROJECT_ID` from its billing account through the Cloud Billing API, with the function's own
 *          service account token from the metadata server.
 * Boundary: internal; `spendStop` uploads it as `index.js`. Plain Node 22 with no dependency (global `fetch`), so the
 *           build installs nothing. Idempotent: a project already detached is left alone, so retried and repeated
 *           notifications are harmless. Throws on a failed detach so Eventarc retries. Detaching stops every paid
 *           service of the project; re-linking is an owner step.
 * Runtime: node
 * Governing contract: ADR 0172 (decision 5: stop non-production spend), ADR 0401 (budgets only alert on GCP, so a
 *                     function detaches billing).
 */

/** The function's `index.js`; its entry point is `stopSpend`. */
export const SPEND_STOP_SOURCE = `"use strict";
const TOKEN_URL = "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token";

exports.stopSpend = async (cloudEvent) => {
  const encoded = cloudEvent && cloudEvent.data && cloudEvent.data.message && cloudEvent.data.message.data;
  if (!encoded) return "ignored";
  const notice = JSON.parse(Buffer.from(encoded, "base64").toString("utf8"));
  const stopAt = Number(process.env.STOP_AT_PERCENT);
  if (!(notice.budgetAmount > 0) || !(stopAt > 0)) return "ignored";
  if (notice.costAmount < (notice.budgetAmount * stopAt) / 100) return "under";

  const project = process.env.PROJECT_ID;
  const token = await (await fetch(TOKEN_URL, { headers: { "Metadata-Flavor": "Google" } })).json();
  const headers = { authorization: "Bearer " + token.access_token, "content-type": "application/json" };
  const url = "https://cloudbilling.googleapis.com/v1/projects/" + project + "/billingInfo";
  const info = await (await fetch(url, { headers })).json();
  if (!info.billingEnabled) return "detached";
  const answer = await fetch(url, { method: "PUT", headers, body: JSON.stringify({ billingAccountName: "" }) });
  if (!answer.ok) throw new Error("Detaching billing from " + project + " failed: " + answer.status);
  console.log("Billing detached from " + project + " at " + notice.costAmount + " of " + notice.budgetAmount);
  return "stopped";
};
`;
