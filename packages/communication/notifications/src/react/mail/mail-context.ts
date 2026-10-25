/**
 * Stackra file contract:
 * Purpose: `MailContext`, the React context the mail renderer fills with the recipient's `MailTools` and `useMail`
 *          reads.
 * Boundary: internal; `null` outside a mail render, which `useMail` turns into an error. No container is needed, so a
 *           mail renders on the server with nothing mounted around it.
 * Runtime: isomorphic
 * Governing contract: ADR 0223 (mail bodies render server-side); ADR 0305 (class components).
 */
import { createContext } from "react";

import type { MailTools } from "#react/mail/mail-tools.type";

/** The tools of the mail being rendered, or null. */
export const MailContext = createContext<MailTools | null>(null);
