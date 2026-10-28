/**
 * Stackra file contract:
 * Purpose: `DocumentStoreConnector`, what a document management system's Connection implements (iManage Work,
 *          NetDocuments, SharePoint): list a folder, fetch a document, and file a new document or a new version.
 * Boundary: an interface a Connection implements when its Integration declares `ConnectorKind.DocumentStore` under
 *           `IntegrationCategory.DocumentManagement`. It is a connector kind, not a sixth `IntegrationRole` (ADR 0355
 *           decision 1 keeps five). The system's own permissions apply to the Connection's account; this contract
 *           widens nothing. `file` is idempotent on its key.
 * Runtime: isomorphic
 * Governing contract: ADR 0447 (decision 6); ADR 0355 (decision 1); juristra-50.
 */
import type { DocumentFile } from "#contracts/types/document-file.type";
import type { StoredDocument } from "#contracts/types/stored-document.type";
import type { StoredDocumentPage } from "#contracts/types/stored-document-page.type";

/**
 * A document store account.
 *
 * @example
 * const page = await store.list(matter.folder);
 */
export interface DocumentStoreConnector {
  /** The documents in `folder`, a page at a time. */
  list: (folder: string, cursor?: string) => Promise<StoredDocumentPage>;

  /** The content of document `id`, its latest version unless `version` names one. */
  fetch: (id: string, version?: string) => Promise<DocumentFile>;

  /**
   * Files `file` in `folder`, or as a new version of document `replaces`; a repeated `idempotencyKey` returns the
   * first answer and files nothing.
   */
  file: (
    folder: string,
    file: DocumentFile,
    idempotencyKey: string,
    replaces?: string,
  ) => Promise<StoredDocument>;
}
