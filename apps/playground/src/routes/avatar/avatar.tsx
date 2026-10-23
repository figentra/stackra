/**
 * Stackra file contract:
 * Purpose: the page of the avatar route: every size, tone, variant and shape, each fallback (image, broken image,
 *          initials, custom icon, person icon), Latin and Arabic names, a labelled next to a decorative avatar, and a
 *          live sample that cycles names and swaps the image, all from `@stackra/ui/react` with real props.
 * Boundary: presentation only; strings in one `STRINGS` constant until @stackra/i18n. No network: the sample image
 *          is an inline SVG data URI, and the broken one points at a path that is not an image.
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 3 and 5); ADR 0303 (decision 7); ADR 0304; ADR 0060 (light, dark, RTL).
 */
import { AvatarShape, AvatarVariant, Size, Tone } from "@stackra/ui/contracts";
import * as Ui from "@stackra/ui/react";
import { Building2 } from "lucide-react";
import { useState } from "react";

import { PageSection } from "#src/components/page-section";
import { AvatarRoute } from "#src/routes/avatar/avatar.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::avatar.*` keys.
const STRINGS = {
  documentTitle: `${AvatarRoute.title} · Stackra Playground`,
  intro:
    "An Avatar draws an image, or else your own fallback, or else the initials of a name, or else a person icon. It is hidden from assistive technology unless it has a label, because the name is usually beside it.",
  sizes: "Sizes and shapes",
  sizesNote: "A row per shape: each size with an image, then with initials.",
  shape: (shape: string) => `Shape ${shape}`,
  withImage: "Image",
  withInitials: "Initials",
  tones: "Tones and variants",
  tonesNote: "A row per variant: the initials of each tone, whose contrast the e2e suite measures.",
  variant: (variant: string) => `Variant ${variant}`,
  fallbacks: "Fallbacks",
  fallbacksNote:
    "An image, a broken image that falls back to initials, an icon for an organisation, and no name at all.",
  loaded: "Loaded image",
  broken: "Broken image",
  organisation: "Organisation",
  anonymous: "No name",
  names: "Names",
  namesNote:
    "Initials are the first letters of the first and last words; an Arabic name gives one letter.",
  accessibleName: "Accessible name",
  accessibleNameNote:
    "A standalone avatar carries a label. In a list row the visible name is enough, so the avatar is decorative.",
  standalone: "Ada Lovelace",
  row: "Ada Lovelace, administrator",
  rowName: "Ada Lovelace",
  rowRole: "Administrator",
  live: "Try it",
  liveNote: "Step through the names and turn the image on or off.",
  nextName: "Next name",
  imageOn: "Show image",
  imageOff: "Hide image",
  current: "Current avatar",
} as const;

/** An abstract shape as an inline image, so the page and its e2e suite never touch the network. */
const SAMPLE_IMAGE = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#64748b"/><circle cx="32" cy="26" r="12" fill="#e2e8f0"/><path d="M8 64a24 24 0 0 1 48 0z" fill="#e2e8f0"/></svg>',
)}`;

/** A path that is not an image, so the avatar falls back to its initials. */
const BROKEN_IMAGE = "/missing-avatar.png";

/** The names of the name sample, each beside its initials, and the live sample's cycle. */
const NAMES = [
  { name: "Ada Lovelace", lang: "en" },
  { name: "Plato", lang: "en" },
  { name: "émile zola", lang: "fr" },
  { name: "ليلى أحمد", lang: "ar" },
] as const;

/** The list that lays samples out in a wrapping row. */
const ROW = "flex flex-wrap items-center gap-4";

/** The Avatar page. */
export function Avatar() {
  const [nameIndex, setNameIndex] = useState(0);
  const [hasImage, setHasImage] = useState(false);
  const current = NAMES[nameIndex] ?? NAMES[0];

  return (
    <article className="grid gap-10">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <Ui.Heading level={1}>{AvatarRoute.title}</Ui.Heading>
        <Ui.Text className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </Ui.Text>
      </header>

      <PageSection id="avatar-sizes" title={STRINGS.sizes} note={STRINGS.sizesNote}>
        {AvatarShape.map((shape) => (
          <div key={shape} className="grid gap-2">
            <Ui.Heading level={3}>{STRINGS.shape(shape)}</Ui.Heading>
            <ul aria-label={STRINGS.shape(shape)} className={ROW}>
              {Size.map((size) => (
                <li key={`${size}-image`}>
                  <Ui.Avatar
                    shape={shape}
                    size={size}
                    src={SAMPLE_IMAGE}
                    name={STRINGS.withImage}
                    data-shape={shape}
                    data-size={size}
                  />
                </li>
              ))}
              {Size.map((size) => (
                <li key={`${size}-initials`}>
                  <Ui.Avatar
                    shape={shape}
                    size={size}
                    name={STRINGS.standalone}
                    data-shape={shape}
                    data-size={size}
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </PageSection>

      <PageSection id="avatar-tones" title={STRINGS.tones} note={STRINGS.tonesNote}>
        {AvatarVariant.map((variant) => (
          <div key={variant} className="grid gap-2">
            <Ui.Heading level={3}>{STRINGS.variant(variant)}</Ui.Heading>
            <ul aria-label={STRINGS.variant(variant)} className={ROW}>
              {Tone.map((tone) => (
                <li key={tone}>
                  <Ui.Avatar
                    variant={variant}
                    tone={tone}
                    name={STRINGS.standalone}
                    data-tone={tone}
                    data-variant={variant}
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </PageSection>

      <PageSection id="avatar-fallbacks" title={STRINGS.fallbacks} note={STRINGS.fallbacksNote}>
        <ul className={ROW}>
          <li className="grid justify-items-center gap-2">
            <Ui.Avatar src={SAMPLE_IMAGE} name={STRINGS.standalone} data-sample="loaded" />
            <Ui.Text tone="muted" type="small">
              {STRINGS.loaded}
            </Ui.Text>
          </li>
          <li className="grid justify-items-center gap-2">
            <Ui.Avatar src={BROKEN_IMAGE} name={STRINGS.standalone} data-sample="broken" />
            <Ui.Text tone="muted" type="small">
              {STRINGS.broken}
            </Ui.Text>
          </li>
          <li className="grid justify-items-center gap-2">
            <Ui.Avatar
              shape="square"
              name={STRINGS.organisation}
              fallback={<Ui.Icon as={Building2} />}
              data-sample="organisation"
            />
            <Ui.Text tone="muted" type="small">
              {STRINGS.organisation}
            </Ui.Text>
          </li>
          <li className="grid justify-items-center gap-2">
            <Ui.Avatar data-sample="anonymous" />
            <Ui.Text tone="muted" type="small">
              {STRINGS.anonymous}
            </Ui.Text>
          </li>
        </ul>
      </PageSection>

      <PageSection id="avatar-names" title={STRINGS.names} note={STRINGS.namesNote}>
        <ul className={ROW}>
          {NAMES.map(({ name, lang }) => (
            <li key={name} className="flex items-center gap-2">
              <Ui.Avatar name={name} data-sample="name" />
              <span lang={lang}>{name}</span>
            </li>
          ))}
        </ul>
      </PageSection>

      <PageSection
        id="avatar-name"
        title={STRINGS.accessibleName}
        note={STRINGS.accessibleNameNote}
      >
        <div className={ROW}>
          <Ui.Avatar name={STRINGS.standalone} label={STRINGS.row} data-sample="labelled" />
          <ul aria-label={STRINGS.accessibleName}>
            <li className="flex items-center gap-2" data-sample="row">
              <Ui.Avatar name={STRINGS.rowName} />
              <span className="grid">
                <span>{STRINGS.rowName}</span>
                <Ui.Text tone="muted" type="small">
                  {STRINGS.rowRole}
                </Ui.Text>
              </span>
            </li>
          </ul>
        </div>
      </PageSection>

      <PageSection id="avatar-live" title={STRINGS.live} note={STRINGS.liveNote}>
        <div className={ROW}>
          <Ui.Button
            variant="secondary"
            onPress={() => setNameIndex((index) => (index + 1) % NAMES.length)}
          >
            {STRINGS.nextName}
          </Ui.Button>
          <Ui.Button variant="secondary" onPress={() => setHasImage((value) => !value)}>
            {hasImage ? STRINGS.imageOff : STRINGS.imageOn}
          </Ui.Button>
        </div>
        <div className={ROW}>
          <Ui.Avatar
            size="lg"
            name={current.name}
            label={STRINGS.current}
            {...(hasImage ? { src: SAMPLE_IMAGE } : {})}
          />
          <span lang={current.lang}>{current.name}</span>
        </div>
      </PageSection>
    </article>
  );
}
