/**
 * Stackra file contract:
 * Purpose: the Settings tab's screen, the app's settings and the native twin of the playground's Theme Studio:
 *          - Appearance: the colour scheme (System, Light, Dark), the app language (@stackra/i18n's
 *            `<LanguageSwitcher />`: one row that opens the phone's language screen for this app, or the languages to
 *            pick in the app below Android 13), and the language with its direction.
 *          - Feedback: the haptics switch (`useHaptic()`), shared with the header menu and remembered.
 *          - Theme: the brand (each approved brand layer over Stackra, Figentra first); the transition a scheme change
 *            draws (Uniwind Pro, a circle from the tap by default, Fade under Reduce Motion); a preset; the accent (on or off, a hue strip, its strength and a live swatch); the
 *            tint; the corner radius; the Latin and Arabic faces. Every change restyles the whole app at once.
 *          - Contrast: the main pairs of the theme on screen against WCAG 2.2 AA, stacked at a large text size.
 *          - Actions: undo, redo and reset; share the theme as JSON through the system share sheet; import a pasted
 *            theme JSON, listing what is wrong with it.
 *          - The app version, at the bottom.
 * Boundary: presentation; the theme state and its push into Uniwind are `../stores/theme-settings.store`; the colour
 *           scheme and the language are the design-system provider's (`useDesignSystem()`), shared with the review
 *           area's display settings, so native headers, the tab bar and the direction follow them too. Every word is a
 *           `settings::*` key (brand and preset names and the language endonyms stay as they are) except the app
 *           language row's; the brand pick is remembered (`displayPrefs`), the rest by `restoreDisplayPrefs` and the
 *           app root. The text size is the phone's (`useAccessibility()`), never set here.
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
import { NativeSwitcher } from "@stackra/i18n";
import type { Locale } from "@stackra/i18n";
import { LanguageSwitcher } from "@stackra/i18n/native";
import { useAccessibility } from "@stackra/theming/react";
import { MotionLevel } from "@stackra/ui/contracts";
import { useCatalogueText, useDesignSystem, useHaptic } from "@stackra/ui/native";
import Constants from "expo-constants";
import { Button, Card, Label, Separator, Slider, Switch, TextArea, TextField } from "heroui-native";
import { memo, useMemo, useState, type ReactNode } from "react";
import { Share, Text, View, type GestureResponderEvent } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

import { Screen } from "../components/ui/screen";
import { BRAND_THEMES } from "../constants/brand-themes.constant";
import { MESSAGES } from "../constants/messages.constant";
import { SETTINGS_KEYS } from "../constants/settings-keys.constant";
import { SHELL_KEYS } from "../constants/shell-keys.constant";
import { displayPrefs } from "../stores/display-prefs.store";
import { themeSettings } from "../stores/theme-settings.store";
import { THEME_PRESETS } from "../stores/theme-presets.constant";
import { THEME_FACES } from "../stores/theme-faces.constant";
import { contrastReport } from "../stores/contrast-report.function";
import { useThemeSettings } from "../stores/use-theme-settings";
import { themeTransition } from "../stores/theme-transition.store";
import { THEME_TRANSITIONS } from "../stores/theme-transitions.constant";
import { useThemeTransition } from "../stores/use-theme-transition";
import { numeralsChoice } from "../stores/numerals-choice.store";
import { useNumeralsChoice } from "../stores/use-numerals-choice";

/** The screen's keys. */
const K = SETTINGS_KEYS.settings;

// shortcut: the app language row's English until its `settings::app_language*` keys exist in both catalogues.
const STRINGS = {
  appLanguage: "App language",
  appLanguageNote: "Opens this app's page in the phone's Settings, where its language is chosen.",
  openSettings: "Open Settings",
  appLanguages: "App languages",
} as const;

/** The scheme choices, worded in render. */
const SCHEMES = ["system", "light", "dark"] as const;

/** The languages, each named in its own language and never translated. */
const LANGUAGES = [
  { id: "en", label: "English (LTR)" },
  { id: "ar", label: "\u2067العربية\u2069 (RTL)" },
] as const;

/** The catalogue key of a contrast pair: its English name in snake_case. */
const pairKey = (name: string) =>
  K.contrast_pairs[name.toLowerCase().replaceAll(" ", "_") as keyof typeof K.contrast_pairs];

/** The font scale from which the contrast rows stack their columns, so large text does not run off the card. */
const STACKED_FONT_SCALE = 1.5;

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
  onSelect: (id: string, event: GestureResponderEvent) => void;
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
            onPress={(event) => onSelect(option.id, event)}
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
  // The thumb and readout follow the finger at once; the theme behind them catches up at the store's draft pace.
  const [live, setLive] = useState<number>();
  const shown = live ?? value;
  return (
    <Slider
      value={shown}
      minValue={min}
      maxValue={max}
      step={step}
      isDisabled={isDisabled}
      onChange={(next) => {
        setLive(single(next));
        onDraft(single(next));
      }}
      onChangeEnd={(next) => {
        setLive(undefined);
        onCommit(single(next));
      }}
      className="gap-1"
    >
      <View className="flex-row items-baseline justify-between gap-2">
        <Label>{label}</Label>
        <Text className="font-mono text-xs text-muted">{`${shown}${unit}`}</Text>
      </View>
      <Slider.Track background={track}>
        {track ? null : <Slider.Fill />}
        <Slider.Thumb accessibilityLabel={label} />
      </Slider.Track>
    </Slider>
  );
}

/** The hue strip behind the accent hue slider, at the accent's strength; it runs end to start in RTL as the slider. */
// Memoised: a hue draft re-renders the screen, and the strip's 13 stops change only with the strength or direction.
const HueStrip = memo(function HueStrip({ chroma, isRtl }: { chroma: number; isRtl: boolean }) {
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
});

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
    setBrand,
    motion,
    setMotion,
  } = useDesignSystem();
  const t = useCatalogueText(MESSAGES.en);
  const haptics = useHaptic();
  const isStacked = useAccessibility().fontScale >= STACKED_FONT_SCALE;
  const [pasted, setPasted] = useState("");
  const [importProblems, setImportProblems] = useState<readonly string[]>([]);
  const [status, setStatus] = useState("");
  const transition = useThemeTransition();
  const numerals = useNumeralsChoice();

  const { base, knobs } = settings.draft ?? settings.present;
  const accent = knobs.accent ?? null;
  const hex = scheme === "dark" ? "hexDark" : "hexLight";
  const accentHex = settings.theme.colors.accent[hex];
  const brand = BRAND_THEMES.find((candidate) => candidate.theme === base);
  const preset = THEME_PRESETS.find(
    (candidate) => JSON.stringify(candidate.knobs) === JSON.stringify(knobs),
  );
  const contrast = useMemo(
    () => contrastReport(settings.theme, scheme === "dark" ? "dark" : "light"),
    [settings.theme, scheme],
  );

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
      setStatus(t(K.share_failed));
    }
  };

  const importPasted = () => {
    try {
      const imported = parseThemeJson(pasted, STACKRA_THEME);
      setImportProblems([]);
      setStatus(t(K.imported, { name: imported.name }));
      themeSettings.dispatch({ type: "change", step: { base: imported, knobs: {} } });
    } catch (error) {
      setImportProblems(error instanceof InvalidThemeError ? error.problems : [String(error)]);
    }
  };

  return (
    <Screen>
      <Section title={t(K.appearance)}>
        <Choice
          label={t(K.scheme)}
          options={SCHEMES.map((id) => ({ id, label: t(K.schemes[id]) }))}
          value={colorScheme}
          onSelect={(id, event) => {
            // The transition grows from the tapped button.
            themeTransition.setOrigin({ x: event.nativeEvent.pageX, y: event.nativeEvent.pageY });
            setColorScheme(id as (typeof SCHEMES)[number]);
          }}
        />
        <Choice label={t(K.language)} options={LANGUAGES} value={locale} onSelect={setLocale} />
        <Choice
          label={t(SHELL_KEYS.shell.digits)}
          options={numeralsChoice.offered.map((id) => ({
            id,
            label: t(SHELL_KEYS.shell.numerals[id]),
          }))}
          value={numerals}
          onSelect={numeralsChoice.set}
        />
        <Choice
          label={t(K.motion)}
          options={MotionLevel.map((id) => ({ id, label: t(K.motions[id]) }))}
          value={motion}
          onSelect={(id) => setMotion(id as MotionLevel)}
        />
        <LanguageSwitcher>
          {(switcher) =>
            switcher.mode === NativeSwitcher.System ? (
              <View className="gap-2">
                <View className="flex-row items-center justify-between gap-3">
                  <Label>{STRINGS.appLanguage}</Label>
                  <Button
                    size="sm"
                    variant="secondary"
                    accessibilityHint={STRINGS.appLanguageNote}
                    onPress={() => void switcher.choose(switcher.locale)}
                  >
                    {STRINGS.openSettings}
                  </Button>
                </View>
                <Text className="text-sm text-muted">{STRINGS.appLanguageNote}</Text>
              </View>
            ) : (
              <Choice
                label={STRINGS.appLanguages}
                options={switcher.locales.map((code) => ({
                  id: code,
                  label: switcher.endonym(code),
                }))}
                value={switcher.locale}
                onSelect={(code) => void switcher.choose(code as Locale)}
              />
            )
          }
        </LanguageSwitcher>
      </Section>

      <Section title={t(K.feedback)}>
        <View className="flex-row items-center justify-between gap-3">
          <View className="flex-1 gap-1">
            <Label>{t(K.haptics)}</Label>
            <Text className="text-sm text-muted">{t(K.haptics_note)}</Text>
          </View>
          <Switch
            accessibilityLabel={t(K.haptics)}
            isSelected={haptics.isEnabled}
            onSelectedChange={haptics.setEnabled}
          />
        </View>
      </Section>

      <Section title={t(K.theme)}>
        <Choice
          label={t(K.brand)}
          options={BRAND_THEMES}
          value={brand?.id}
          onSelect={(id) => {
            const picked = BRAND_THEMES.find((candidate) => candidate.id === id);
            if (!picked) return;
            themeSettings.dispatch({ type: "change", step: { base: picked.theme, knobs: {} } });
            setBrand(picked.id);
            displayPrefs.set("brand", picked.id);
          }}
        />
        <Choice
          label={t(K.transition)}
          options={THEME_TRANSITIONS.map(({ id, key }) => ({
            id: String(id),
            label: t(K.transitions[key as keyof typeof K.transitions]),
          }))}
          value={String(transition)}
          onSelect={(id) => themeTransition.setPreset(Number(id))}
        />
        <Separator />
        <Choice
          label={t(K.preset)}
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
          <Label>{t(K.accent)}</Label>
          <View className="flex-row items-center gap-3">
            <View
              accessible
              accessibilityLabel={t(K.accent_swatch, { hex: accentHex })}
              className="size-8 rounded-full border border-border"
              style={{ backgroundColor: accentHex }}
            />
            <Switch
              accessibilityLabel={t(K.accent)}
              isSelected={accent !== null}
              onSelectedChange={(isOn) => commit({ accent: isOn ? DEFAULT_ACCENT : null })}
            />
          </View>
        </View>
        <KnobSlider
          label={t(K.accent_hue)}
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
          label={t(K.accent_chroma)}
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
          label={t(K.neutral_hue)}
          value={knobs.neutralHue ?? 248}
          min={0}
          max={360}
          step={1}
          unit="°"
          onDraft={(neutralHue) => draft({ neutralHue })}
          onCommit={(neutralHue) => commit({ neutralHue })}
        />
        <KnobSlider
          label={t(K.neutral_chroma)}
          value={knobs.neutralChroma ?? 0.005}
          min={0}
          max={0.03}
          step={0.001}
          onDraft={(neutralChroma) => draft({ neutralChroma })}
          onCommit={(neutralChroma) => commit({ neutralChroma })}
        />
        <KnobSlider
          label={t(K.radius)}
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
          label={t(K.latin)}
          options={THEME_FACES.latin.map(({ id }) => ({
            id,
            label: t(K.faces[id as keyof typeof K.faces]),
          }))}
          value={faceId("latin", knobs.fontSans)}
          onSelect={(id) =>
            commit({ fontSans: THEME_FACES.latin.find((candidate) => candidate.id === id)?.stack })
          }
        />
        <Choice
          label={t(K.arabic)}
          options={THEME_FACES.arabic.map(({ id }) => ({
            id,
            label: t(K.faces[id as keyof typeof K.faces]),
          }))}
          value={faceId("arabic", knobs.fontArabic)}
          onSelect={(id) =>
            commit({
              fontArabic: THEME_FACES.arabic.find((candidate) => candidate.id === id)?.stack,
            })
          }
        />
        <Text className="text-sm text-muted">{t(K.faces_note)}</Text>
        <Problems title={t(K.invalid)} problems={settings.problems} />
      </Section>

      <Section title={t(K.contrast)}>
        <Text className="text-sm text-muted">{t(K.contrast_note)}</Text>
        {contrast.map(({ name, ratio, needs, isPassing }) => (
          <View
            key={name}
            accessible
            accessibilityLabel={t(K.contrast_label, {
              name: t(pairKey(name)),
              ratio: ratio.toFixed(2),
              verdict: t(isPassing ? K.passes : K.fails),
            })}
            className={isStacked ? "gap-1" : "flex-row items-center justify-between gap-3"}
          >
            <Text className={`text-sm text-foreground ${isStacked ? "" : "flex-1"}`}>
              {t(pairKey(name))}
            </Text>
            <Text className="font-mono text-xs text-muted">{`${ratio.toFixed(2)} / ${needs}`}</Text>
            <Text className={`text-xs font-medium ${isPassing ? "text-success" : "text-danger"}`}>
              {t(isPassing ? K.passes : K.fails)}
            </Text>
          </View>
        ))}
      </Section>

      <Section title={t(K.actions)}>
        <View className="flex-row flex-wrap gap-2">
          <Button
            size="sm"
            variant="secondary"
            isDisabled={settings.past.length === 0}
            onPress={() => themeSettings.dispatch({ type: "undo" })}
          >
            {t(K.undo)}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            isDisabled={settings.future.length === 0}
            onPress={() => themeSettings.dispatch({ type: "redo" })}
          >
            {t(K.redo)}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onPress={() => themeSettings.dispatch({ type: "reset" })}
          >
            {t(K.reset)}
          </Button>
          <Button size="sm" variant="secondary" onPress={() => void share()}>
            {t(K.share)}
          </Button>
        </View>
        <Separator />
        <TextField isInvalid={importProblems.length > 0}>
          <Label>{t(K.paste)}</Label>
          <TextArea
            value={pasted}
            onChangeText={setPasted}
            autoCapitalize="none"
            autoCorrect={false}
            numberOfLines={4}
          />
        </TextField>
        <Text className="text-sm text-muted">{t(K.paste_note)}</Text>
        <Problems title={t(K.import_invalid)} problems={importProblems} />
        <Button
          size="sm"
          isDisabled={pasted.trim() === ""}
          onPress={importPasted}
          className="self-start"
        >
          {t(K.import)}
        </Button>
        {status ? (
          <Text accessibilityLiveRegion="polite" className="text-sm text-muted">
            {status}
          </Text>
        ) : null}
      </Section>

      <Card>
        <Card.Body>
          <Card.Title>{t(K.version)}</Card.Title>
          <Card.Description>{Constants.expoConfig?.version ?? "dev"}</Card.Description>
        </Card.Body>
      </Card>
    </Screen>
  );
}
