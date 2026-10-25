/**
 * Stackra file contract:
 * Purpose: `REDACTED_FIELDS`, the field names `redact` always masks: credentials and the common personal data a log
 *          line must never carry. A host adds its own through `LoggingConfig.redaction.extraFields`.
 * Boundary: names in normalised form (lower case, letters and digits only); a key matches when its normalised form
 *           ends with one of them, so `apiKey`, `api_key`, `x-api-key` and `stripeApiKey` all match `apikey`. Internal:
 *           not exported from the entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0147 (decision 1: redaction with secret detection); ADR 0071; ADR 0184 (decision 5).
 */

/** Credential and personal-data field names, normalised. */
export const REDACTED_FIELDS: readonly string[] = Object.freeze([
  "password",
  "passcode",
  "passphrase",
  "secret",
  "token",
  "apikey",
  "privatekey",
  "authorization",
  "cookie",
  "creditcard",
  "cardnumber",
  "cvv",
  "cvc",
  "iban",
  "ssn",
  "email",
  "phone",
  "phonenumber",
  "address",
  "firstname",
  "lastname",
  "fullname",
  "dateofbirth",
  "birthdate",
]);
