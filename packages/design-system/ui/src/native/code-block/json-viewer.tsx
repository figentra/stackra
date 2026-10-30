/**
 * Stackra file contract:
 * Purpose: the native `JsonViewer`: a JSON value as a tree whose objects and arrays fold on press, keys and leaves
 *          in the theme's syntax colours (`syntax-<role>`), and a count beside a folded branch.
 * Boundary: left to right on every screen; each branch is a button with its expanded state.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371.
 */
import { type ReactElement, useState } from "react";
import { Pressable, View } from "react-native";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import type { JsonViewerProps } from "#native/code-block/json-viewer.props";
import { Text } from "#native/text/text";

/** Left to right. */
const LTR = { writingDirection: "ltr", textAlign: "left" } as const;
/** The monospaced line style. */
const LINE = "font-mono text-[13px] leading-6";

/** A leaf in its tone. */
function leafOf(value: unknown): ReactElement {
  if (typeof value === "string")
    return <Text className={`${LINE} text-syntax-string`}>{JSON.stringify(value)}</Text>;
  if (typeof value === "number")
    return <Text className={`${LINE} text-syntax-number`}>{String(value)}</Text>;
  if (typeof value === "boolean")
    return <Text className={`${LINE} text-syntax-keyword`}>{String(value)}</Text>;
  return <Text className={`${LINE} text-syntax-keyword`}>{"null"}</Text>;
}

/** One node. */
function Node({
  name,
  value,
  depth,
  open,
}: {
  readonly name: string | null;
  readonly value: unknown;
  readonly depth: number;
  readonly open: number;
}): ReactElement {
  const t = useUiText();
  const [isOpen, setOpen] = useState(depth < open);
  const key = name === null ? "" : `${name}: `;
  if (value === null || typeof value !== "object")
    return (
      <View className="flex-row ps-4" style={{ direction: "ltr" }}>
        <Text className={`${LINE} text-syntax-variable`}>{key}</Text>
        {leafOf(value)}
      </View>
    );
  const isArray = Array.isArray(value);
  const entries = isArray
    ? value.map((item, index) => [String(index), item] as const)
    : Object.entries(value);
  const [start, end] = isArray ? ["[", "]"] : ["{", "}"];
  return (
    <View className="ps-4" style={{ direction: "ltr" }}>
      <Pressable
        onPress={() => setOpen(!isOpen)}
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
        accessibilityHint={
          isOpen ? t(UI_KEYS.ui.json_viewer.collapse) : t(UI_KEYS.ui.json_viewer.expand)
        }
      >
        <Text className={LINE} style={LTR}>
          {`${isOpen ? "▾" : "▸"} ${key}${start}${isOpen ? "" : ` ${entries.length} ${end}`}`}
        </Text>
      </Pressable>
      {isOpen ? (
        <>
          {entries.map(([child, item]) => (
            <Node
              key={child}
              name={isArray ? null : child}
              value={item}
              depth={depth + 1}
              open={open}
            />
          ))}
          <Text className={`${LINE} ps-4`} style={LTR}>
            {end}
          </Text>
        </>
      ) : null}
    </View>
  );
}

/** A foldable JSON tree. */
export function JsonViewer({
  value,
  label,
  defaultExpandDepth = 1,
  className,
}: JsonViewerProps): ReactElement {
  return (
    <View
      accessibilityLabel={label}
      className={[
        "rounded-[var(--radius-container)] border border-separator bg-surface-secondary py-3 pe-3",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Node name={null} value={value} depth={0} open={defaultExpandDepth} />
    </View>
  );
}
