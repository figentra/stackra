/**
 * Stackra file contract:
 * Purpose: the "pin" demo of the native PasswordField: a POS staff PIN that shakes with an error haptic when wrong and plays a success haptic when right.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); gap inventory row 3; ADR 0310
 *          (decision 6).
 */
import { Button, PasswordField, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { PASSWORD_FIELD_DEMO_KEYS } from "#src/demos/free/password-field/password-field-demo-keys.constant";

/** The demo's keys. */
const K = PASSWORD_FIELD_DEMO_KEYS.demo_free.password_field.pin;

/** The PIN this demo accepts; a real register checks it on the server. */
const STAFF_PIN = "2468";

/** Switch cashier with a 4-digit PIN. */
export default function Pin() {
  const t = useCatalogueText(MESSAGES.en);
  const [pin, setPin] = useState("");
  const [isWrong, setWrong] = useState(false);
  const [isUnlocked, setUnlocked] = useState(false);
  const check = () => {
    const isRight = pin === STAFF_PIN;
    setWrong(!isRight);
    setUnlocked(isRight);
    if (!isRight) setPin("");
  };
  return (
    <View className="gap-3">
      <PasswordField
        label={t(K.pin)}
        description={t(K.pin_demo, { pin: STAFF_PIN })}
        mode="pin"
        pinLength={4}
        value={pin}
        onChange={(next) => {
          setPin(next);
          setWrong(false);
        }}
        onSubmitEditing={check}
        isInvalid={isWrong}
        isAccepted={isUnlocked}
        errorMessage={t(K.pin_wrong)}
      />
      <Button onPress={check}>{t(K.unlock)}</Button>
      <Text tone="success" type="small" accessibilityLiveRegion="polite">
        {isUnlocked ? t(K.unlocked) : ""}
      </Text>
    </View>
  );
}
