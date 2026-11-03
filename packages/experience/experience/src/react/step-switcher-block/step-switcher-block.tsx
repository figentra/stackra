/**
 * Stackra file contract:
 * Purpose: `StepSwitcherBlock`, the landing's step switcher: plain words joined by arrows (`Tabs variant="steps"`),
 *          each step's title and line beside its code in a schematic window.
 * Boundary: composition of @stackra/ui only; every word comes in props. Tabs owns the keyboard (the arrow keys move
 *           and select, mirrored in right-to-left); CodeBlock keeps the code left to right.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0165 (UI through @stackra/ui); ADR 0060 (RTL); STA-2041 (taste
 *                     v2 §3).
 */
import { CodeBlock, Frame, Heading, Tabs, Text } from "@stackra/ui/react";
import type { ReactElement } from "react";

import type { StepSwitcherBlockProps } from "#react/step-switcher-block/step-switcher-block.props";

/**
 * Steps with their code.
 *
 * @example
 * <StepSwitcherBlock label="Write it once" steps={steps} />
 */
export function StepSwitcherBlock({
  label,
  steps,
  className,
}: StepSwitcherBlockProps): ReactElement {
  return (
    <Tabs
      label={label}
      variant="steps"
      {...(className === undefined ? {} : { className })}
      items={steps.map((step) => ({
        id: step.id,
        label: step.label,
        content: (
          <div className="grid gap-6 pt-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <div className="flex flex-col gap-2">
              <Heading level={3} type="h4">
                {step.title}
              </Heading>
              <Text tone="muted">{step.body}</Text>
            </div>
            <Frame variant="schematic" title={step.code.filename}>
              <CodeBlock code={step.code.source} language={step.code.language} />
            </Frame>
          </div>
        ),
      }))}
    />
  );
}
