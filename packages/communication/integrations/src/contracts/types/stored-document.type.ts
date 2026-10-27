/**
 * Stackra file contract:
 * Purpose: `StoredDocument`, one document in a document management system (iManage, NetDocuments, SharePoint): its id
 *          there, name, folder, version and when it last changed.
 * Boundary: a type only. The folder is the system's own id (a workspace, a cabinet folder, a library path); which
 *           folder holds a matter is per-Connection or per-record data, never code.
 * Runtime: isomorphic
 * Governing contract: ADR 0447 (decision 6); juristra-50.
 */

/** A document in a document store. */
export interface StoredDocument {
  /** The system's id of the document. */
  readonly id: string;

  /** The file name. */
  readonly name: string;

  /** The system's id of the folder that holds it. */
  readonly folder: string;

  /** The system's version label, when it versions documents. */
  readonly version?: string;

  /** The media type. */
  readonly contentType?: string;

  /** When it last changed. */
  readonly modifiedAt: Date;
}
