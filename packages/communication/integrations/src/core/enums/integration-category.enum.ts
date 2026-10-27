/**
 * Stackra file contract:
 * Purpose: `IntegrationCategory`, the shelf an Integration is listed under in the console's integrations marketplace
 *          (`category: IntegrationCategory.Email`).
 * Boundary: an `Enum.of` value plus the type of the same name. Gen derives each category's label from the code; a new
 *           shelf is a new member.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rule 1: `Integration({ provider, category, ... })`); ADR 0231 (snake_case codes); ADR
 *                     0422 (decision 5: payroll); app-shells D14 (app stores); ADR 0447 (decision 1: the connector
 *                     shelves `edi`, `fraud`, `food_delivery`, `courier`, `document_management`, `esl`, `scales` and
 *                     `court`).
 */
import { Enum } from "@stackra/contracts";

/**
 * The marketplace shelves.
 *
 * @example
 * Integration({ provider: "resend", category: IntegrationCategory.Email, levels, auth });
 */
export const IntegrationCategory = Enum.of({
  /** Transactional and marketing mail. */
  Email: "email",
  /** SMS, chat and push providers. */
  Messaging: "messaging",
  /** Payment gateways and payouts. */
  Payments: "payments",
  /** Carriers, labels and tracking. */
  Shipping: "shipping",
  /** Calendars and scheduling. */
  Calendar: "calendar",
  /** Booking marketplaces and reservation channels. */
  Booking: "booking",
  /** Telephone calls: numbers, inbound and outbound voice, recordings. */
  Telephony: "telephony",
  /** Wallet passes (Apple Wallet, Google Wallet). */
  Wallet: "wallet",
  /** File and object storage. */
  Storage: "storage",
  /** Customer relationship management. */
  Crm: "crm",
  /** Accounting and invoicing. */
  Accounting: "accounting",
  /** App stores a white-label app is published to under the merchant's own account (`StoreAccountConnector`). */
  AppStores: "app_stores",
  /** Payroll providers the pay inputs are pushed to (`PayrollConnector`). */
  Payroll: "payroll",
  /** Product and web analytics. */
  Analytics: "analytics",
  /** Advertising and marketing automation. */
  Marketing: "marketing",
  /** Model and AI providers. */
  Ai: "ai",
  /** EDI networks that carry purchase orders, despatch advice and invoices with trading partners (`EdiConnector`). */
  Edi: "edi",
  /** Fraud scoring of orders and payments (`FraudScoringConnector`). */
  Fraud: "fraud",
  /** Food delivery apps that take orders for a restaurant or store (`SalesChannelConnector`). */
  FoodDelivery: "food_delivery",
  /** Couriers and last-mile delivery fleets booked per order. */
  Courier: "courier",
  /** Document management systems a firm files its matters in (`DocumentStoreConnector`). */
  DocumentManagement: "document_management",
  /** Electronic shelf labels a store pushes prices and stock to. */
  Esl: "esl",
  /** Weighing scales that price and label goods sold by weight. */
  Scales: "scales",
  /** Court systems that take filings and report case events. */
  Court: "court",
  /** Anything no other shelf fits. */
  Other: "other",
});

/** One of the codes above. */
export type IntegrationCategory = Enum.Value<typeof IntegrationCategory>;
