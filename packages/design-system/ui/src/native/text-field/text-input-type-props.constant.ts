/**
 * Stackra file contract:
 * Purpose: `TEXT_INPUT_TYPE_PROPS`: the keyboard, masking and capitalisation each kind of text needs.
 * Boundary: data only.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decision
 *          7); ADR 0165 (HeroUI Native on native); ADR 0055 (forms: one field contract); owner decision 6 of STA-350
 *          (thin wrappers).
 */
import type { TextInputProps } from "react-native";
import type { TextFieldType } from "#contracts/enums/text-field-type.enum";

/**
 * The keyboard, masking and capitalisation each kind of text needs: what the web input's `type` does for free.
 * A caller's own `keyboardType` or `secureTextEntry` is spread after these and wins.
 */
export const TEXT_INPUT_TYPE_PROPS: Readonly<Record<TextFieldType, TextInputProps>> = Object.freeze(
  {
    text: {},
    email: {
      keyboardType: "email-address",
      autoCapitalize: "none",
      autoComplete: "email",
      autoCorrect: false,
    },
    password: {
      secureTextEntry: true,
      autoCapitalize: "none",
      autoComplete: "password",
      autoCorrect: false,
    },
    tel: { keyboardType: "phone-pad", autoComplete: "tel" },
    url: { keyboardType: "url", autoCapitalize: "none", autoCorrect: false },
  },
);
