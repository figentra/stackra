/**
 * Stackra file contract:
 * Purpose: the Theme Studio's "Storefront" template: a shop's bar, a hero with two calls to action, a grid of product
 *          cards (badges, ratings, prices) and a newsletter sign-up.
 * Boundary: a canvas template with no props; the theme is the canvas's. Product pictures are drawn with the theme's
 *          own colours, so the template needs no images.
 * Runtime: browser
 * Governing contract: ADR 0320 (the Theme Studio).
 */
import {
  Button,
  Card,
  Chip,
  Heading,
  Icon,
  IconButton,
  Link,
  Text,
  TextField,
  useCatalogueText,
} from "@stackra/ui/react";

import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { THEME_STUDIO_KEYS } from "#src/routes/theme-studio/theme-studio-keys.constant";

import { STUDIO_DISPLAY } from "./studio-display.constant";

/** The template's keys. */
const K = THEME_STUDIO_KEYS.theme_studio.store;

const PRODUCTS = [
  { id: "coat", price: "480", tag: "new", rating: 5, tint: "var(--accent)" },
  { id: "scarf", price: "65", tag: null, rating: 4, tint: "var(--success)" },
  { id: "bag", price: "220", tag: "sale", rating: 4, tint: "var(--warning)" },
  { id: "boots", price: "310", tag: null, rating: 5, tint: "var(--foreground)" },
] as const;

const STARS = [1, 2, 3, 4, 5] as const;

/** The storefront template. */
export function StudioStorefront() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="grid gap-8">
      <nav className="flex items-center justify-between gap-4 border-b border-separator pb-4">
        <span className={`text-xl font-semibold ${STUDIO_DISPLAY}`}>{t(K.brand)}</span>
        <ul className="hidden items-center gap-6 text-sm @2xl:flex">
          {(["shop", "new", "journal"] as const).map((id) => (
            <li key={id}>
              <Link href="#">{t(K.nav[id])}</Link>
            </li>
          ))}
        </ul>
        <IconButton icon={Icons.ShoppingBag} label={t(K.cart)} variant="ghost" />
      </nav>
      <section
        className="grid items-center gap-6 bg-surface-secondary p-6 @3xl:grid-cols-2 @3xl:p-10"
        style={{ borderRadius: "calc(var(--radius)*4)" }}
      >
        <div className="grid content-center gap-4">
          <Text tone="muted" type="small" className="font-medium tracking-wide uppercase">
            {t(K.eyebrow)}
          </Text>
          <Heading level={2} className={`[font:var(--h1)] ${STUDIO_DISPLAY}`}>
            {t(K.headline)}
          </Heading>
          <Text tone="muted">
            <bdi>{t(K.body)}</bdi>
          </Text>
          <div className="flex flex-wrap gap-2">
            <Button size="lg">{t(K.shop)}</Button>
            <Button size="lg" variant="outline">
              {t(K.lookbook)}
            </Button>
          </div>
        </div>
        <div
          aria-hidden="true"
          className="aspect-[4/3] bg-[linear-gradient(135deg,var(--accent),var(--accent-soft))]"
          style={{ borderRadius: "calc(var(--radius)*3)" }}
        />
      </section>
      <section className="grid gap-4">
        <Heading level={3} className={`[font:var(--h3)] ${STUDIO_DISPLAY}`}>
          {t(K.featured)}
        </Heading>
        <ul className="grid gap-4 @xl:grid-cols-2 @4xl:grid-cols-4">
          {PRODUCTS.map((product) => (
            <li key={product.id}>
              <Card className="h-full">
                <div
                  aria-hidden="true"
                  className="relative aspect-square bg-[color-mix(in_oklch,var(--tint)_18%,var(--surface-secondary))]"
                  style={{
                    borderRadius: "calc(var(--radius)*2)",
                    ["--tint" as string]: product.tint,
                  }}
                >
                  {product.tag ? (
                    <Chip
                      size="sm"
                      tone={product.tag === "sale" ? "danger" : "accent"}
                      className="absolute start-3 top-3"
                    >
                      {t(K[product.tag])}
                    </Chip>
                  ) : null}
                </div>
                <Card.Header>
                  <Card.Title className={STUDIO_DISPLAY}>{t(K.products[product.id])}</Card.Title>
                  <div
                    role="img"
                    aria-label={t(K.rating, { value: product.rating })}
                    className="flex gap-0.5"
                  >
                    {STARS.map((star) => (
                      <Icon
                        key={star}
                        name={Icons.Star}
                        size="sm"
                        tone={star <= product.rating ? "warning" : "muted"}
                      />
                    ))}
                  </div>
                </Card.Header>
                <Card.Footer className="items-center justify-between gap-2">
                  <span className="font-semibold" dir="ltr">
                    {`$${product.price}`}
                  </span>
                  <Button size="sm" variant="secondary">
                    {t(K.add)}
                  </Button>
                </Card.Footer>
              </Card>
            </li>
          ))}
        </ul>
      </section>
      <section className="grid items-end gap-4 border-t border-separator pt-6 @3xl:grid-cols-[1fr_auto]">
        <div className="grid gap-1">
          <Heading level={3} className={`[font:var(--h4)] ${STUDIO_DISPLAY}`}>
            {t(K.newsletter)}
          </Heading>
          <Text tone="muted">
            <bdi>{t(K.newsletter_note)}</bdi>
          </Text>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <TextField label={t(K.email)} type="email" className="w-64" />
          <Button>{t(K.subscribe)}</Button>
        </div>
      </section>
    </div>
  );
}
