/**
 * Stackra file contract:
 * Purpose: `StepSwitcher`, the landing's step switcher: plain words joined by arrows (`Tabs variant="steps"`),
 *          each step's title and line above its code in a schematic window; a single step draws no tabs, only its
 *          words and window.
 * Boundary: composition of @stackra/ui only; every word comes in props. Tabs owns the keyboard (the arrow keys move
 *           and select, mirrored in right-to-left); CodeBlock keeps the code left to right. One column, so the window
 *           takes the station's whole track. A step's title sits one level under the station's (`h4` by default).
 *           Inside a station it draws in the station's band; alone, in its own ruled band.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0165 (UI through @stackra/ui); ADR 0060 (RTL); WCAG 2.2 SC 1.3.1;
 *                     STA-2041 (taste v2 §3).
 */
import { CodeBlock, Frame, Heading, Tabs, Text } from "@stackra/ui/react";
import type { ReactElement } from "react";

import { RuledBand } from "#react/ruled-band/ruled-band";
import type { StepSwitcherProps } from "#react/step-switcher/step-switcher.props";

/**
 * Steps with their code.
 *
 * @example
 * <StepSwitcher label="Write it once" steps={steps} />
 */
export function StepSwitcher({
  label,
  steps,
  headingLevel = 4,
  className,
}: StepSwitcherProps): ReactElement {
  const panel = (step: StepSwitcherProps["steps"][number]) => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Heading level={headingLevel} type="h4">
          {step.title}
        </Heading>
        <Text tone="muted">{step.body}</Text>
      </div>
      <Frame variant="schematic" title={step.code.filename}>
        <CodeBlock code={step.code.source} language={step.code.language} />
      </Frame>
    </div>
  );
  const [only] = steps;
  return (
    <RuledBand>
      {steps.length === 1 && only ? (
        <div data-slot="step-switcher" className={className ?? ""}>
          {panel(only)}
        </div>
      ) : (
        <Tabs
          label={label}
          variant="steps"
          {...(className === undefined ? {} : { className })}
          items={steps.map((step) => ({
            id: step.id,
            label: step.label,
            content: <div className="pt-6">{panel(step)}</div>,
          }))}
        />
      )}
    </RuledBand>
  );
}
