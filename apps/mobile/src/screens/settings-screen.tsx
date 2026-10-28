/**
 * Stackra file contract:
 * Purpose: the Settings tab's screen, the app's settings and the native twin of the playground's Theme Studio:
 *          - Appearance: the colour scheme (System, Light, Dark), the app language row that opens the phone's
 *            language screen for this app (iOS, Android 13 and later), and the language with its direction.
 *          - Theme: a preset; the accent (on or off, a hue strip, its strength and a live swatch); the neutral hue and
 *            tint; the corner radius; the Latin and Arabic faces. Every change restyles the whole app at once.
 *          - Contrast: the main pairs of the theme on screen against WCAG 2.2 AA.
 *          - Actions: undo, redo and reset; share the theme as JSON through the system share sheet; import a pasted
 *            theme JSON, listing what is wrong with it.
 *          - The app version, at the bottom.
 * Boundary: presentation; the theme state and its push into Uniwind are `../stores/theme-settings.store`; the colour
 *           scheme and the language are the design-system provider's (`useDesignSystem()`), shared with the review
 *           area's display settings, so native headers, the tab bar and the direction follow them too.
 * Runtime: react-native
 * Governing contract: ADR 0320 (the Theme Studio); ADR 0080 (2026-10-29 note: the language follows the phone); ADR 0007 (documentation); WCAG 2.2 SC 1.3.1, 1.4.3, 4.1.2, 4.1.3.
 */
import {
  exportThemeJson,
  InvalidThemeError,
  oklchToHex,
  parseThemeJson,
  STACKRA_THEME,
} from "@stackra/tokens";
import type { ThemeKnobs } from "@stackra/tokens/contracts";
import { useDesignSystem } from "@stackra/ui/native";
import Constants from "expo-constants";
import { Button, Card, Label, Separator, Slider, Switch, TextArea, TextField } from "heroui-native";
import { useState, type ReactNode } from "react";
import { Linking, Platform, Share, Text, View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

import { Screen } from "../components/ui/screen";
import { themeSettings } from "../stores/theme-settings.store";
import { THEME_PRESETS } from "../stores/theme-presets.constant";
import { THEME_FACES } from "../stores/theme-faces.constant";
import { contrastReport } from "../stores/contrast-report.function";
import { useThemeSettings } from "../stores/use-theme-settings";

// shortcut: English strings in one place until @stackra/i18n ships; then `mobile::settings.*` keys.
const STRINGS = {
  appearance: "Appearance",
  scheme: "Colour scheme",
  schemes: { system: "System", light: "Light", dark: "Dark" },
  appLanguage: "App language",
  appLanguageNote: "Opens this app's page in the phone's Settings, where its language is chosen.",
  openSettings: "Open Settings",
  language: "Language and direction",
  languages: { en: "English (LTR)", ar: "العربية (RTL)" },
  theme: "Theme",
  preset: "Preset",
  accent: "Accent colour",
  accentSwatch: (hex: string) => `Accent colour ${hex}`,
  accentHue: "Accent hue",
  accentChroma: "Accent strength",
  neutralHue: "Neutral hue",
  neutralChroma: "Neutral tint",
  radius: "Corner radius",
  latin: "Latin face",
  arabic: "Arabic face",
  facesNote: "Faces change the exported theme; the app draws in the system face.",
  invalid: "These settings make a theme that cannot be used; the last good one stays on screen:",
  contrast: "Contrast",
  contrastNote: "Text needs 4.5:1, edges and focus 3:1 (WCAG 2.2 AA).",
  passes: "Passes AA",
  fails: "Below AA",
  actions: "Theme actions",
  undo: "Undo",
  redo: "Redo",
  reset: "Reset",
  share: "Share theme JSON",
  shareFailed: "The share sheet did not open.",
  paste: "Paste a theme JSON",
  pasteNote:
    "A full export, a changes-only export or a bare theme. It is checked before it is used.",
  import: "Import",
  imported: (name: string) => `Imported the "${name}" theme.`,
  importInvalid: "That theme cannot be used:",
  version: "Version",
} as const;

const SCHEMES = [
  { id: "system", label: STRINGS.schemes.system },
  { id: "light", label: STRINGS.schemes.light },
  { id: "dark", label: STRINGS.schemes.dark },
] as const;

const LANGUAGES = [
  { id: "en", label: STRINGS.languages.en },
  { id: "ar", label: STRINGS.languages.ar },
] as const;

// shortcut: @stackra/i18n's nativeSwitcherMode (system; Android below 13 has no per-app language screen), inlined
// until the app mounts I18nProvider with expo-localization; then the row is its <LanguageSwitcher />.
/** Whether the phone has a language screen for this app. */
const HAS_SYSTEM_LANGUAGE = Platform.OS !== "android" || Number(Platform.Version) >= 33;

/** The accent the switch turns on when the knobs hold none, as the web studio's. */
const DEFAULT_ACCENT = { hue: 248, chroma: 0.12 };

/** The hue strip's stops, every 30°, at the accent's lightness in the light scheme. */
const HUE_STOPS = Array.from({ length: 13 }, (_, index) => index * 30);

/** The id of the face whose stack is `stack`, if one is on offer. */
const faceId = (family: "latin" | "arabic", stack: string | undefined) =>
  THEME_FACES[family].find((candidate) => candidate.stack === stack)?.id;

/** One card of settings under its title. */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <Card.Body className="gap-4">
        <Card.Title>{title}</Card.Title>
        {children}
      </Card.Body>
    </Card>
  );
}

/** A labelled single choice: one button per option, read as a radio group. */
function Choice({
  label,
  options,
  value,
  onSelect,
}: {
  label: string;
  options: readonly { id: string; label: string }[];
  value: string | undefined;
  onSelect: (id: string) => void;
}) {
  return (
    <View className="gap-2">
      <Label>{label}</Label>
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={label}
        className="flex-row flex-wrap gap-2"
      >
        {options.map((option) => (
          <Button
            key={option.id}
            size="sm"
            variant={option.id === value ? "primary" : "secondary"}
            accessibilityRole="radio"
            accessibilityState={{ checked: option.id === value }}
            onPress={() => onSelect(option.id)}
          >
            {option.label}
          </Button>
        ))}
      </View>
    </View>
  );
}

/** A labelled slider showing its value: it previews while it moves and commits when it is let go. */
function KnobSlider({
  label,
  value,
  min,
  max,
  step,
  unit = "",
  isDisabled = false,
  track,
  onDraft,
  onCommit,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  isDisabled?: boolean;
  /** Drawn behind the thumb instead of the fill, as the hue strip is. */
  track?: ReactNode;
  onDraft: (value: number) => void;
  onCommit: (value: number) => void;
}) {
  const single = (next: number | number[]) => (typeof next === "number" ? next : (next[0] ?? min));
  return (
    <Slider
      value={value}
      minValue={min}
      maxValue={max}
      step={step}
      isDisabled={isDisabled}
      onChange={(next) => onDraft(single(next))}
      onChangeEnd={(next) => onCommit(single(next))}
      className="gap-1"
    >
      <View className="flex-row items-baseline justify-between gap-2">
        <Label>{label}</Label>
        <Text className="font-mono text-xs text-muted">{`${value}${unit}`}</Text>
      </View>
      <Slider.Track background={track}>
        {track ? null : <Slider.Fill />}
        <Slider.Thumb accessibilityLabel={label} />
      </Slider.Track>
    </Slider>
  );
}

/** The hue strip behind the accent hue slider, at the accent's strength; it runs end to start in RTL as the slider. */
function HueStrip({ chroma, isRtl }: { chroma: number; isRtl: boolean }) {
  return (
    <Slider.TrackBackground>
      <Svg width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <LinearGradient
            id="hue-strip"
            x1={isRtl ? "1" : "0"}
            x2={isRtl ? "0" : "1"}
            y1="0"
            y2="0"
          >
            {HUE_STOPS.map((hue) => (
              <Stop
                key={hue}
                offset={hue / 360}
                stopColor={oklchToHex(`oklch(0.52 ${chroma} ${hue})`)}
              />
            ))}
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#hue-strip)" />
      </Svg>
    </Slider.TrackBackground>
  );
}

/** A list of problems under its heading, announced as an alert. */
function Problems({ title, problems }: { title: string; problems: readonly string[] }) {
  if (problems.length === 0) return null;
  return (
    <View accessibilityRole="alert" className="gap-1">
      <Text className="text-sm font-medium text-danger">{title}</Text>
      {problems.slice(0, 8).map((problem) => (
        <Text key={problem} className="text-sm text-danger">{`• ${problem}`}</Text>
      ))}
    </View>
  );
}

/** The Settings tab: appearance, theme, contrast, theme actions and the app version. */
export function SettingsScreen() {
  const settings = useThemeSettings();
  const {
    colorScheme,
    resolvedColorScheme: scheme,
    setColorScheme,
    locale,
    setLocale,
    direction,
  } = useDesignSystem();
  const [pasted, setPasted] = useState("");
  const [importProblems, setImportProblems] = useState<readonly string[]>([]);
  const [status, setStatus] = useState("");

  const { base, knobs } = settings.draft ?? settings.present;
  const accent = knobs.accent ?? null;
  const hex = scheme === "dark" ? "hexDark" : "hexLight";
  const accentHex = settings.theme.colors.accent[hex];
  const preset =
    base === STACKRA_THEME
      ? THEME_PRESETS.find((candidate) => JSON.stringify(candidate.knobs) === JSON.stringify(knobs))
      : undefined;

  const step = (change: ThemeKnobs) => ({ base, knobs: { ...knobs, ...change } });
  const commit = (change: ThemeKnobs) =>
    themeSettings.dispatch({ type: "change", step: step(change) });
  const draft = (change: ThemeKnobs) =>
    themeSettings.dispatch({ type: "draft", step: step(change) });

  const share = async () => {
    try {
      await Share.share({
        title: `${settings.theme.name}.theme.json`,
        message: JSON.stringify(exportThemeJson(settings.theme), null, 2),
      });
    } catch {
      setStatus(STRINGS.shareFailed);
    }
  };

  const importPasted = () => {
    try {
      const imported = parseThemeJson(pasted, STACKRA_THEME);
      setImportProblems([]);
      setStatus(STRINGS.imported(imported.name));
      themeSettings.dispatch({ type: "change", step: { base: imported, knobs: {} } });
    } catch (error) {
      setImportProblems(error instanceof InvalidThemeError ? error.problems : [String(error)]);
    }
  };

  return (
    <Screen>
      <Section title={STRINGS.appearance}>
        <Choice
          label={STRINGS.scheme}
          options={SCHEMES}
          value={colorScheme}
          onSelect={(id) => setColorScheme(id as (typeof SCHEMES)[number]["id"])}
        />
        {HAS_SYSTEM_LANGUAGE ? (
          <View className="gap-2">
            <View className="flex-row items-center justify-between gap-3">
              <Label>{STRINGS.appLanguage}</Label>
              <Button
                size="sm"
                variant="secondary"
                accessibilityHint={STRINGS.appLanguageNote}
                onPress={() => void Linking.openSettings()}
              >
                {STRINGS.openSettings}
              </Button>
            </View>
            <Text className="text-sm text-muted">{STRINGS.appLanguageNote}</Text>
          </View>
        ) : null}
        <Choice label={STRINGS.language} options={LANGUAGES} value={locale} onSelect={setLocale} />
      </Section>

      <Section title={STRINGS.theme}>
        <Choice
          label={STRINGS.preset}
          options={THEME_PRESETS}
          value={preset?.id}
          onSelect={(id) => {
            const picked = THEME_PRESETS.find((candidate) => candidate.id === id);
            if (picked)
              themeSettings.dispatch({ type: "change", step: { base, knobs: picked.knobs } });
          }}
        />
        <Separator />
        <View className="flex-row items-center justify-between gap-3">
          <Label>{STRINGS.accent}</Label>
          <View className="flex-row items-center gap-3">
            <View
              accessible
              accessibilityLabel={STRINGS.accentSwatch(accentHex)}
              className="size-8 rounded-full border border-border"
              style={{ backgroundColor: accentHex }}
            />
            <Switch
              accessibilityLabel={STRINGS.accent}
              isSelected={accent !== null}
              onSelectedChange={(isOn) => commit({ accent: isOn ? DEFAULT_ACCENT : null })}
            />
          </View>
        </View>
        <KnobSlider
          label={STRINGS.accentHue}
          value={accent?.hue ?? DEFAULT_ACCENT.hue}
          min={0}
          max={360}
          step={1}
          unit="°"
          isDisabled={accent === null}
          track={
            <HueStrip
              chroma={accent?.chroma ?? DEFAULT_ACCENT.chroma}
              isRtl={direction === "rtl"}
            />
          }
          onDraft={(hue) =>
            draft({ accent: { hue, chroma: accent?.chroma ?? DEFAULT_ACCENT.chroma } })
          }
          onCommit={(hue) =>
            commit({ accent: { hue, chroma: accent?.chroma ?? DEFAULT_ACCENT.chroma } })
          }
        />
        <KnobSlider
          label={STRINGS.accentChroma}
          value={accent?.chroma ?? DEFAULT_ACCENT.chroma}
          min={0.02}
          max={0.3}
          step={0.01}
          isDisabled={accent === null}
          onDraft={(chroma) =>
            draft({ accent: { hue: accent?.hue ?? DEFAULT_ACCENT.hue, chroma } })
          }
          onCommit={(chroma) =>
            commit({ accent: { hue: accent?.hue ?? DEFAULT_ACCENT.hue, chroma } })
          }
        />
        <Separator />
        <KnobSlider
          label={STRINGS.neutralHue}
          value={knobs.neutralHue ?? 248}
          min={0}
          max={360}
          step={1}
          unit="°"
          onDraft={(neutralHue) => draft({ neutralHue })}
          onCommit={(neutralHue) => commit({ neutralHue })}
        />
        <KnobSlider
          label={STRINGS.neutralChroma}
          value={knobs.neutralChroma ?? 0.005}
          min={0}
          max={0.03}
          step={0.001}
          onDraft={(neutralChroma) => draft({ neutralChroma })}
          onCommit={(neutralChroma) => commit({ neutralChroma })}
        />
        <KnobSlider
          label={STRINGS.radius}
          value={knobs.radius ?? 4}
          min={0}
          max={20}
          step={1}
          unit=" px"
          onDraft={(radius) => draft({ radius })}
          onCommit={(radius) => commit({ radius })}
        />
        <Separator />
        <Choice
          label={STRINGS.latin}
          options={THEME_FACES.latin}
          value={faceId("latin", knobs.fontSans)}
          onSelect={(id) =>
            commit({ fontSans: THEME_FACES.latin.find((candidate) => candidate.id === id)?.stack })
          }
        />
        <Choice
          label={STRINGS.arabic}
          options={THEME_FACES.arabic}
          value={faceId("arabic", knobs.fontArabic)}
          onSelect={(id) =>
            commit({
              fontArabic: THEME_FACES.arabic.find((candidate) => candidate.id === id)?.stack,
            })
          }
        />
        <Text className="text-sm text-muted">{STRINGS.facesNote}</Text>
        <Problems title={STRINGS.invalid} problems={settings.problems} />
      </Section>

      <Section title={STRINGS.contrast}>
        <Text className="text-sm text-muted">{STRINGS.contrastNote}</Text>
        {contrastReport(settings.theme, scheme === "dark" ? "dark" : "light").map(
          ({ name, ratio, needs, isPassing }) => (
            <View
              key={name}
              accessible
              accessibilityLabel={`${name}: ${ratio.toFixed(2)} to 1, ${isPassing ? STRINGS.passes : STRINGS.fails}`}
              className="flex-row items-center justify-between gap-3"
            >
              <Text className="flex-1 text-sm text-foreground">{name}</Text>
              <Text className="font-mono text-xs text-muted">
                {`${ratio.toFixed(2)} / ${needs}`}
              </Text>
              <Text className={`text-xs font-medium ${isPassing ? "text-success" : "text-danger"}`}>
                {isPassing ? STRINGS.passes : STRINGS.fails}
              </Text>
            </View>
          ),
        )}
      </Section>

      <Section title={STRINGS.actions}>
        <View className="flex-row flex-wrap gap-2">
          <Button
            size="sm"
            variant="secondary"
            isDisabled={settings.past.length === 0}
            onPress={() => themeSettings.dispatch({ type: "undo" })}
          >
            {STRINGS.undo}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            isDisabled={settings.future.length === 0}
            onPress={() => themeSettings.dispatch({ type: "redo" })}
          >
            {STRINGS.redo}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onPress={() => themeSettings.dispatch({ type: "reset" })}
          >
            {STRINGS.reset}
          </Button>
          <Button size="sm" variant="secondary" onPress={() => void share()}>
            {STRINGS.share}
          </Button>
        </View>
        <Separator />
        <TextField isInvalid={importProblems.length > 0}>
          <Label>{STRINGS.paste}</Label>
          <TextArea
            value={pasted}
            onChangeText={setPasted}
            autoCapitalize="none"
            autoCorrect={false}
            numberOfLines={4}
          />
        </TextField>
        <Text className="text-sm text-muted">{STRINGS.pasteNote}</Text>
        <Problems title={STRINGS.importInvalid} problems={importProblems} />
        <Button
          size="sm"
          isDisabled={pasted.trim() === ""}
          onPress={importPasted}
          className="self-start"
        >
          {STRINGS.import}
        </Button>
        {status ? (
          <Text accessibilityLiveRegion="polite" className="text-sm text-muted">
            {status}
          </Text>
        ) : null}
      </Section>

      <Card>
        <Card.Body>
          <Card.Title>{STRINGS.version}</Card.Title>
          <Card.Description>{Constants.expoConfig?.version ?? "dev"}</Card.Description>
        </Card.Body>
      </Card>
    </Screen>
  );
}
