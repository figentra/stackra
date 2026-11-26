/**
 * Stackra file contract:
 * Purpose: the "button" demo of the web PropsPlayground: a live Button with its label, variant, size, disabled and
 *          loading props as controls, and the preview's left-to-right and right-to-left switch.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 *           The control names are prop names (code, never translated); the variant and size choices are the
 *           contract's own `ButtonVariant` and `Size` lists, so they never drift from the Button.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-2041.
 */
import { ButtonVariant, Size } from "@stackra/ui/contracts";
import { Button, PropsPlayground, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { PROPS_PLAYGROUND_KEYS } from "#src/demos/free/props-playground/props-playground-keys.constant";

/** The demo's keys. */
const K = PROPS_PLAYGROUND_KEYS.props_playground;

/** The PropsPlayground demo: Button. */
export default function ButtonPlayground() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <PropsPlayground
      label="Button"
      className="w-full"
      controls={[
        { name: "children", type: "string", default: t(K.upgrade) },
        { name: "variant", type: "enum", options: ButtonVariant, default: "primary" },
        { name: "size", type: "enum", options: Size, default: "md" },
        { name: "isDisabled", type: "boolean" },
        { name: "isLoading", type: "boolean" },
      ]}
      render={(values) => (
        <Button
          variant={ButtonVariant.find((variant) => variant === values["variant"])}
          size={Size.find((size) => size === values["size"])}
          isDisabled={values["isDisabled"] === true}
          isLoading={values["isLoading"] === true}
        >
          {String(values["children"] ?? "")}
        </Button>
      )}
    />
  );
}
