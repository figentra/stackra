/**
 * Stackra file contract:
 * Purpose: `OrganizationPage`, the tenancy kit's organisation settings page: the profile (name, legal name, default
 *          language, time zone, with the fixed handle and market beside them) read and saved through the
 *          `TenantProfile` port, then the legal entities and the domains the host lists.
 * Boundary: composition of @stackra/ui (PageHeader, Form, FormSection, Section, PropertyList, TextField,
 *           StatusBadge) over the container's `TenantProfile`. A save sends only the fields that changed; a failed
 *           read shows an ErrorState with a retry, a failed save a danger Alert (announced), a done save a status
 *           line. The page reaches no other resource.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0260 (client ports); ADR 0165 (UI through @stackra/ui); WCAG 2.2
 *                     SC 3.3.1, 4.1.3.
 */
import { useContainer } from "@stackra/container/react";
import {
  Alert,
  Button,
  ErrorState,
  Form,
  FormSection,
  PageHeader,
  PageSkeleton,
  PropertyList,
  Section,
  StatusBadge,
  Text,
  TextField,
} from "@stackra/ui/react";
import { type FormEvent, type ReactElement, useCallback, useEffect, useState } from "react";

import { TenantProfile } from "#contracts/ports/tenant-profile.port";
import type { TenantProfileView } from "#contracts/types/tenant-profile-view.type";
import type { OrganizationPageProps } from "#react/organization-page/organization-page.props";

/** The editable fields, as the form holds them. */
interface Draft {
  readonly name: string;
  readonly legalName: string;
  readonly defaultLocale: string;
  readonly timeZone: string;
}

/** The form's start from a profile. */
const draftOf = (profile: TenantProfileView): Draft => ({
  name: profile.name,
  legalName: profile.legalName ?? "",
  defaultLocale: profile.defaultLocale,
  timeZone: profile.timeZone,
});

/** Every section, in the default order. */
const ALL_SECTIONS = ["profile", "legal-entities", "domains"] as const;

/**
 * The organisation settings page.
 *
 * @example
 * <OrganizationPage domains={domains} labels={labels} />
 */
export function OrganizationPage({
  sections = ALL_SECTIONS,
  legalEntities,
  domains,
  onSaved,
  labels,
}: OrganizationPageProps): ReactElement {
  const port = useContainer().get(TenantProfile);
  const [profile, setProfile] = useState<TenantProfileView | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [isLoadFailed, setLoadFailed] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [saved, setSaved] = useState<"idle" | "done" | "failed">("idle");

  // `isLive` is false once the page is gone, so a late answer sets nothing.
  const read = useCallback(
    (isLive: () => boolean) =>
      port.get().then(
        (answer) => {
          if (!isLive()) return;
          setProfile(answer);
          setDraft(draftOf(answer));
        },
        () => {
          if (isLive()) setLoadFailed(true);
        },
      ),
    [port],
  );
  useEffect(() => {
    let isLive = true;
    void read(() => isLive);
    return () => {
      isLive = false;
    };
  }, [read]);

  const edit = (field: keyof Draft) => (value: string) => {
    setSaved("idle");
    setDraft((current) => (current === null ? current : { ...current, [field]: value }));
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (profile === null || draft === null) return;
    const start = draftOf(profile);
    const changed = Object.fromEntries(
      Object.entries(draft).filter(([field, value]) => start[field as keyof Draft] !== value),
    ) as Partial<Draft>;
    setSaving(true);
    setSaved("idle");
    try {
      const next = await port.update(changed);
      setProfile(next);
      setDraft(draftOf(next));
      setSaved("done");
      onSaved?.(next);
    } catch {
      setSaved("failed");
    } finally {
      setSaving(false);
    }
  };

  const header = <PageHeader title={labels.title} description={labels.description} />;
  if (isLoadFailed)
    return (
      <div className="flex flex-col gap-6">
        {header}
        <ErrorState
          title={labels.loadFailed}
          retry={{
            label: labels.retry,
            onPress: () => {
              setLoadFailed(false);
              void read(() => true);
            },
          }}
        />
      </div>
    );
  if (profile === null || draft === null) return <PageSkeleton loadingLabel={labels.loading} />;

  const section = {
    profile: (
      <Form key="profile" onSubmit={(event) => void save(event)}>
        <FormSection title={labels.profile}>
          <PropertyList
            columns="auto"
            items={[
              { id: "handle", label: labels.handle, value: profile.handle },
              { id: "market", label: labels.market, value: profile.market },
            ]}
          />
          <TextField
            label={labels.name}
            isRequired
            value={draft.name}
            onChange={edit("name")}
            name="name"
          />
          <TextField
            label={labels.legalName}
            value={draft.legalName}
            onChange={edit("legalName")}
            name="legalName"
          />
          <TextField
            label={labels.defaultLocale}
            isRequired
            value={draft.defaultLocale}
            onChange={edit("defaultLocale")}
            name="defaultLocale"
          />
          <TextField
            label={labels.timeZone}
            isRequired
            value={draft.timeZone}
            onChange={edit("timeZone")}
            name="timeZone"
          />
        </FormSection>
        {saved === "failed" && <Alert tone="danger" title={labels.saveFailed} />}
        <div className="flex items-center gap-3">
          <Button type="submit" isLoading={isSaving}>
            {labels.save}
          </Button>
          <Text role="status" tone="success" type="small">
            {saved === "done" ? labels.saved : ""}
          </Text>
        </div>
      </Form>
    ),
    "legal-entities":
      legalEntities === undefined ? null : (
        <Section key="legal-entities" title={labels.legalEntities} headingLevel={2}>
          <PropertyList
            emptyValue={labels.noTaxNumber}
            items={legalEntities.map((entity) => ({
              id: entity.id,
              label: entity.name,
              value: entity.taxNumber,
            }))}
          />
        </Section>
      ),
    domains:
      domains === undefined ? null : (
        <Section key="domains" title={labels.domains} headingLevel={2}>
          <PropertyList
            items={domains.map((domain) => ({
              id: domain.id,
              label: domain.host,
              value: (
                <StatusBadge tone={domain.isVerified ? "success" : "warning"}>
                  {domain.isVerified ? labels.verified : labels.unverified}
                </StatusBadge>
              ),
            }))}
          />
        </Section>
      ),
  };

  return (
    <div className="flex flex-col gap-6">
      {header}
      {sections.map((name) => section[name])}
    </div>
  );
}
