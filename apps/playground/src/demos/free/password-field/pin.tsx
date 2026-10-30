/**
 * Stackra file contract:
 * Purpose: the "pin" demo of the web PasswordField: a POS staff PIN that shakes on a wrong PIN and unlocks on the right one.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); gap inventory row 3; ADR 0060
 *          (light, dark, RTL).
 */
import {
  Button,
  PasswordField as UiPasswordField,
  Text,
  useCatalogueText,
} from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { PASSWORD_FIELD_KEYS } from "#src/demos/free/password-field/password-field-keys.constant";

/** The demo's keys. */
const K = PASSWORD_FIELD_KEYS.password_field;

/** The PIN this demo accepts; a real register checks it on the server. */
const STAFF_PIN = "2468";

/** Password field: Staff PIN. */
export default function Pin() {
  const t = useCatalogueText(MESSAGES.en);
  const [pin, setPin] = useState("");
  const [isWrong, setWrong] = useState(false);
  const [isUnlocked, setUnlocked] = useState(false);
  return (
    <form
      className="grid max-w-xs gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        const isRight = pin === STAFF_PIN;
        setWrong(!isRight);
        setUnlocked(isRight);
        if (!isRight) setPin("");
      }}
    >
      <UiPasswordField
        label={t(K.pin)}
        description={t(K.pin_demo, { pin: STAFF_PIN })}
        mode="pin"
        pinLength={4}
        value={pin}
        onChange={(next) => {
          setPin(next);
          setWrong(false);
        }}
        isInvalid={isWrong}
        isAccepted={isUnlocked}
        errorMessage={t(K.pin_wrong)}
      />
      <Button type="submit">{t(K.unlock)}</Button>
      <Text role="status" tone="success" type="small">
        {isUnlocked ? t(K.unlocked) : null}
      </Text>
    </form>
  );
}
