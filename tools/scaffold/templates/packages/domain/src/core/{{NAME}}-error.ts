/** A state the {{NAME}} domain does not permit. Callers map it to their transport's error shape. */
export class {{PASCAL}}Error extends Error {
  override readonly name = "{{PASCAL}}Error";
}
