/**
 * Stackra file contract:
 * Purpose: a labelled row of mutually exclusive choices, built from HeroUI Native buttons; the selected one is
 *          filled and announced as selected, so the state does not rest on colour alone.
 * Boundary: one presentational, controlled component; it holds no state of its own.
 * Runtime: react-native
 * Governing contract: ADR 0304 (decision 6); STA-403 FR-013.
 */
import { Button, Typography } from "heroui-native";
import { View } from "react-native";

/** One choice of a {@link ChoiceGroup}. */
interface Choice<Value extends string> {
  /** The value passed to `onChange` when this choice is picked. */
  value: Value;
  /** The text on the button, in the language it names. */
  label: string;
}

/** Props of {@link ChoiceGroup}. */
export interface ChoiceGroupProps<Value extends string> {
  /** The group's name, shown above the buttons and read by screen readers. */
  label: string;
  /** The choices, in display order. */
  choices: readonly Choice<Value>[];
  /** The selected value. */
  value: Value;
  /** Called with the value of the choice the user picked. */
  onChange: (value: Value) => void;
}

/** A labelled, single-select row of buttons: the picked one is the primary button, the others secondary. */
export function ChoiceGroup<Value extends string>({
  label,
  choices,
  value,
  onChange,
}: ChoiceGroupProps<Value>) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} className="gap-2">
      <Typography.Paragraph type="body-sm" color="muted">
        {label}
      </Typography.Paragraph>
      <View className="flex-row gap-2">
        {choices.map((choice) => {
          const isSelected = choice.value === value;
          return (
            <Button
              key={choice.value}
              size="sm"
              variant={isSelected ? "primary" : "secondary"}
              className="flex-1"
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              onPress={() => onChange(choice.value)}
            >
              {choice.label}
            </Button>
          );
        })}
      </View>
    </View>
  );
}
