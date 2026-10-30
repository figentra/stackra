/**
 * Stackra file contract:
 * Purpose: `StormTiles`, the theme-storm hero's picture: a grid of real @stackra/ui components in whatever theme the
 *          hero is drawn in: revenue (`Stat` with its badge, bars), notifications (`Switch`), a person (`Avatar`), a plan
 *          (`ToggleButtonGroup`), an email (`TextField`) and a deploy card (`Button` on the accent).
 * Boundary: a picture: `aria-hidden` and `inert`. Every colour is a theme variable, so a re-theme redraws it all. On
 *           a phone it keeps the revenue, notifications, person and deploy tiles.
 * Runtime: browser
 * Governing contract: owner decision 2026-10-28 (hero concept B); STA-1371; WCAG 2.2 SC 1.1.1.
 */
import {
  Avatar,
  Button,
  Stat,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  useCatalogueText,
} from "@stackra/ui/react";
import { motion } from "motion/react";

import { BRAND_KEYS } from "#src/constants/brand-keys.constant";
import { MESSAGES } from "#src/constants/messages.constant";

import type { StormTilesProps } from "./storm-tiles.props";

/** The storm hero's keys. */
const K = BRAND_KEYS.brand.hero.storm;

/** The revenue bars, in percent of their row; the last is this week's. */
const BARS = [38, 52, 46, 64, 58, 72, 66, 80, 74, 88, 82, 96];

/** A tile: the theme's surface and edge, its corners a step rounder than the controls. */
const TILE =
  "hero-card border border-border bg-surface p-4 text-surface-foreground shadow-[var(--surface-shadow)]";

/** The grid of components. */
export function StormTiles({ isStill }: StormTilesProps) {
  const t = useCatalogueText(MESSAGES.en);
  // Each tile pops in a beat after the last on the first draw.
  const pop = (index: number) =>
    isStill
      ? {}
      : {
          initial: { opacity: 0, y: 18, scale: 0.96 },
          animate: { opacity: 1, y: 0, scale: 1 },
          transition: { duration: 0.7, delay: index * 0.08, ease: [0.2, 1.4, 0.4, 1] as const },
        };

  return (
    <div
      aria-hidden="true"
      inert
      className="relative grid grid-cols-2 gap-3 self-center select-none sm:grid-cols-6 sm:gap-4"
    >
      <motion.span
        className="pointer-events-none absolute -end-44 -top-40 -z-10 size-[32rem] hero-round border border-dashed border-border max-sm:hidden"
        animate={isStill ? {} : { rotate: 360 }}
        transition={{ duration: 18, ease: "linear", repeat: Infinity }}
      />
      <motion.div
        className={`${TILE} col-span-2 flex min-h-64 flex-col gap-4 sm:col-span-4 sm:row-span-3`}
        {...pop(0)}
      >
        <Stat label={t(K.revenue)} value={12_480} badge={t(K.this_week)} />
        <div className="flex flex-1 items-end gap-2">
          {BARS.map((height, index) => (
            <motion.span
              key={height}
              className={`flex-1 origin-bottom hero-bar ${index === BARS.length - 1 ? "bg-accent" : "bg-[color-mix(in_oklab,var(--accent)_35%,var(--surface))]"}`}
              style={{ height: `${height}%` }}
              initial={isStill ? false : { scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 1.4, delay: index * 0.05, ease: [0.2, 0.8, 0.2, 1] }}
            />
          ))}
        </div>
      </motion.div>
      <motion.div
        className={`${TILE} flex flex-col justify-between gap-3 sm:col-span-2`}
        {...pop(1)}
      >
        <span className="text-sm text-muted">{t(K.notifications)}</span>
        <Switch defaultValue aria-label={t(K.notifications)} />
      </motion.div>
      <motion.div className={`${TILE} flex items-center gap-3 sm:col-span-2`} {...pop(2)}>
        <Avatar name={t(K.person)} tone="accent" />
        <span className="grid min-w-0">
          <span className="truncate font-semibold">{t(K.person)}</span>
          <span className="truncate text-sm text-muted">{t(K.person_note)}</span>
        </span>
      </motion.div>
      <motion.div
        className={`${TILE} flex flex-col gap-2.5 max-sm:hidden sm:col-span-2`}
        {...pop(3)}
      >
        <span className="text-sm text-muted">{t(K.plan)}</span>
        <ToggleButtonGroup
          aria-label={t(K.plan)}
          size="sm"
          selectionMode="single"
          defaultSelectedKeys={["team"]}
        >
          <ToggleButton id="team">{t(K.team)}</ToggleButton>
          <ToggleButton id="free">{t(K.free)}</ToggleButton>
        </ToggleButtonGroup>
      </motion.div>
      <motion.div className={`${TILE} max-sm:hidden sm:col-span-3`} {...pop(4)}>
        <TextField label={t(K.email)} defaultValue="lina@example.com" isFullWidth />
      </motion.div>
      <motion.div
        className="col-span-2 flex flex-wrap items-center justify-between gap-3 hero-card bg-accent p-4 text-accent-foreground sm:col-span-3"
        {...pop(5)}
      >
        <span className="grid">
          <span className="text-lg font-semibold">{t(K.deploy)}</span>
          <span className="text-sm">{t(K.deploy_note)}</span>
        </span>
        <Button variant="secondary" size="sm">
          {t(K.ship)}
        </Button>
      </motion.div>
    </div>
  );
}
