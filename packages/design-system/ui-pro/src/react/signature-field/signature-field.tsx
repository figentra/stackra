/**
 * Stackra file contract:
 * Purpose: the web `SignatureField`: a box to sign in with a pointer (mouse, pen or finger), drawn as SVG strokes, and
 *          beside it a text input to sign by typing a name, the keyboard way; a clear button empties both. It reports
 *          the drawn path or the typed name, or null.
 * Boundary: the mark only: binding it to a document, a signer and evidence is `@stackra/documents`' e-signature port.
 *           Controlled by `value` or holding its own strokes; drawing replaces a typed name and typing replaces a
 *           drawing. The box is an image named by the label; the typed input is the accessible way to sign. HeroUI Pro
 *           has no signature pad, so the box is the package's own markup, with `@stackra/ui`'s TextField and Button.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); WCAG 2.2 SC 2.1.1, 2.5.7 and 3.3.2.
 */
import { Button, TextField } from "@stackra/ui/react";
import { useId, useRef, useState, type PointerEvent, type ReactElement } from "react";

import type { SignatureValue } from "#contracts/types/signature-value.type";
import { pathOfStrokes } from "#core/functions/path-of-strokes.function";
import type { SignatureFieldProps } from "#react/signature-field/signature-field.props";

/** One stroke's points, in the box's units. */
type Stroke = (readonly [number, number])[];

/** A field to sign in, by drawing or by typing. */
export function SignatureField({
  label,
  description,
  errorMessage,
  isRequired,
  isInvalid,
  isDisabled,
  value,
  onChange,
  clearLabel,
  typedLabel,
  width = 400,
  height = 150,
}: SignatureFieldProps): ReactElement {
  const labelId = useId();
  const descriptionId = useId();
  const box = useRef<SVGSVGElement | null>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [own, setOwn] = useState<SignatureValue | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const current = value === undefined ? own : value;
  const viewBox = `0 0 ${width} ${height}`;

  const report = (next: SignatureValue | null): void => {
    setOwn(next);
    onChange?.(next);
  };

  /** The pointer's position in the box's units. */
  const pointOf = (pointer: PointerEvent<SVGSVGElement>): readonly [number, number] => {
    const rect = box.current?.getBoundingClientRect();
    if (rect === undefined || rect.width === 0 || rect.height === 0) return [0, 0];
    return [
      ((pointer.clientX - rect.left) / rect.width) * width,
      ((pointer.clientY - rect.top) / rect.height) * height,
    ];
  };

  const start = (pointer: PointerEvent<SVGSVGElement>): void => {
    if (isDisabled) return;
    pointer.currentTarget.setPointerCapture?.(pointer.pointerId);
    const base = current?.kind === "drawn" ? strokes : [];
    setStrokes([...base, [pointOf(pointer)]]);
    setIsDrawing(true);
  };

  const draw = (pointer: PointerEvent<SVGSVGElement>): void => {
    if (!isDrawing) return;
    const point = pointOf(pointer);
    setStrokes((all) => [...all.slice(0, -1), [...(all.at(-1) ?? []), point]]);
  };

  const end = (): void => {
    if (!isDrawing) return;
    setIsDrawing(false);
    report({ kind: "drawn", path: pathOfStrokes(strokes), viewBox });
  };

  const clear = (): void => {
    setStrokes([]);
    report(null);
  };

  const drawnPath = isDrawing
    ? pathOfStrokes(strokes)
    : current?.kind === "drawn"
      ? current.path
      : "";

  return (
    <div
      data-slot="signature-field"
      data-invalid={isInvalid || undefined}
      className="flex flex-col gap-2"
    >
      <span id={labelId} className="text-sm font-medium">
        {label}
        {isRequired ? <span aria-hidden="true"> *</span> : null}
      </span>
      <svg
        ref={box}
        role="img"
        aria-labelledby={labelId}
        aria-describedby={description == null ? undefined : descriptionId}
        viewBox={viewBox}
        data-disabled={isDisabled || undefined}
        className="h-auto w-full touch-none rounded-md border border-border bg-surface"
        onPointerDown={start}
        onPointerMove={draw}
        onPointerUp={end}
        onPointerCancel={end}
      >
        <path
          d={drawnPath}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
        />
      </svg>
      <TextField
        label={typedLabel}
        value={current?.kind === "typed" ? current.text : ""}
        onChange={(text) => {
          setStrokes([]);
          report(text.trim() === "" ? null : { kind: "typed", text });
        }}
        isDisabled={isDisabled}
        isRequired={isRequired}
        autoComplete="name"
      />
      {description == null ? null : (
        <p id={descriptionId} className="text-xs text-muted">
          {description}
        </p>
      )}
      {isInvalid && errorMessage != null ? (
        <p role="alert" className="text-xs text-danger">
          {errorMessage}
        </p>
      ) : null}
      <div>
        <Button
          size="sm"
          variant="ghost"
          onPress={clear}
          isDisabled={isDisabled || current === null}
        >
          {clearLabel}
        </Button>
      </div>
    </div>
  );
}
