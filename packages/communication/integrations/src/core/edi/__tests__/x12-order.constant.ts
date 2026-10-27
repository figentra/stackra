/**
 * Stackra file contract:
 * Purpose: `X12_ORDER`, a recorded X12 850 purchase order (CRLF line ends) from a made-up supplier to Figentra, for the
 *          EDI envelope and connector tests.
 * Boundary: test data only; hand-written from the public X12 004010 envelope rules, certification pending (owner D3,
 *           2026-10-27). No real partner or trading data.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0447 (decision 4); stackra-46 re-scope (R2-7, M6).
 */

/** An X12 850 from ZZ:ACMEFOODS to ZZ:FIGENTRA, interchange 42, test. */
export const X12_ORDER = [
  "ISA*00*          *00*          *ZZ*ACMEFOODS      *ZZ*FIGENTRA       *261028*0930*U*00401*000000042*0*T*>~",
  "GS*PO*ACMEFOODS*FIGENTRA*20261028*0930*42*X*004010~",
  "ST*850*0001~",
  "BEG*00*SA*PO-7781**20261028~",
  "PO1*1*24*EA*3.25**VN*SKU-1~",
  "CTT*1~",
  "SE*5*0001~",
  "GE*1*42~",
  "IEA*1*000000042~",
  "",
].join("\r\n");
