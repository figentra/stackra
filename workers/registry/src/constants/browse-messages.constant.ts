/**
 * Stackra file contract:
 * Purpose: `BROWSE_MESSAGES`: every string of the registry browser in English and Arabic.
 * Boundary: a constant only; values are plain text (callers escape them), `{n}` and `{q}` are filled by callers.
 * Runtime: worker
 * Governing contract: ADR 0453; ADR 0297 (locales).
 */
import type { BrowseLocale } from "#src/interfaces/browse-locale.type";

const EN = {
  title: "Stackra registry",
  tagline: "Packages for building with Stackra, served to npm, pnpm and Yarn.",
  search: "Search packages",
  count: "{n} packages",
  noResults: "No package matches “{q}”.",
  allPackages: "All packages",
  other: "Other",
  install: "Install",
  installOpen: "Add the scope to your project’s .npmrc, then add the package:",
  installPro: "Pro packages also need a licence token in STACKRA_LICENCE_TOKEN:",
  readme: "Readme",
  noReadme: "This version has no README.",
  versions: "Versions",
  distTags: "Dist-tags",
  dependencies: "Dependencies",
  peerDependencies: "Peer dependencies",
  none: "None",
  provenance: "Provenance",
  commit: "Source commit",
  workflow: "Workflow",
  run: "Build run",
  noProvenance: "No provenance statement is stored for this version.",
  licence: "Licence",
  licencePro: "Stackra Pro: a licence is needed.",
  licenceLink: "How licences work",
  gated:
    "Metadata only. A Pro package’s readme, dependencies and provenance show when the request carries a licence token that may read it.",
  latest: "Latest",
  published: "Published",
  repository: "Repository",
  homepage: "Homepage",
  keywords: "Keywords",
  deprecated: "Deprecated",
  notFound: "Package not found",
  notFoundBody: "There is no package at this address.",
  docs: "Documentation",
  switchLanguage: "العربية",
  pro: "Pro",
  skip: "Skip to content",
} as const;

/** One locale's strings. */
type Messages = { readonly [key in keyof typeof EN]: string };

const AR: Messages = {
  title: "سجل Stackra",
  tagline: "حزم للبناء باستخدام Stackra، تُقدَّم إلى npm وpnpm وYarn.",
  search: "ابحث في الحزم",
  count: "عدد الحزم: {n}",
  noResults: "لا توجد حزمة تطابق «{q}».",
  allPackages: "كل الحزم",
  other: "أخرى",
  install: "التثبيت",
  installOpen: "أضف النطاق إلى ملف ‎.npmrc في مشروعك، ثم أضف الحزمة:",
  installPro: "تحتاج حزم Pro أيضًا إلى رمز ترخيص في STACKRA_LICENCE_TOKEN:",
  readme: "الملف التعريفي",
  noReadme: "لا يحتوي هذا الإصدار على ملف README.",
  versions: "الإصدارات",
  distTags: "وسوم التوزيع",
  dependencies: "الاعتماديات",
  peerDependencies: "الاعتماديات النظيرة",
  none: "لا يوجد",
  provenance: "المصدر",
  commit: "إيداع المصدر",
  workflow: "سير العمل",
  run: "تشغيل البناء",
  noProvenance: "لا يوجد بيان مصدر مخزَّن لهذا الإصدار.",
  licence: "الترخيص",
  licencePro: "Stackra Pro: يلزم ترخيص.",
  licenceLink: "كيف تعمل التراخيص",
  gated:
    "البيانات الوصفية فقط. يظهر الملف التعريفي والاعتماديات والمصدر لحزمة Pro عندما يحمل الطلب رمز ترخيص يسمح بقراءتها.",
  latest: "الأحدث",
  published: "تاريخ النشر",
  repository: "المستودع",
  homepage: "الصفحة الرئيسية",
  keywords: "الكلمات المفتاحية",
  deprecated: "مُهمَل",
  notFound: "الحزمة غير موجودة",
  notFoundBody: "لا توجد حزمة في هذا العنوان.",
  docs: "التوثيق",
  switchLanguage: "English",
  pro: "Pro",
  skip: "انتقل إلى المحتوى",
};

/** Every string of the registry browser, by locale. */
export const BROWSE_MESSAGES: Readonly<Record<BrowseLocale, Messages>> = { en: EN, ar: AR };
