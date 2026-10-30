/**
 * Stackra file contract:
 * Purpose: `SEARCH_EVALUATION_CATALOGUE`, the small bilingual catalogue the evaluation queries are judged against: sixteen
 *          products with an English and an Arabic title and a short description in each.
 * Boundary: data only, in the `./testing` entry. Ids are plain strings (`p01`), not public ids: the set is for a search
 *           engine's relevance, not a model. A change to a row is a change to the labels of `SEARCH_EVALUATION_QUERIES`.
 * Runtime: isomorphic
 * Governing contract: ADR 0492 (decision 5 and enforcement: a fixed evaluation set of Arabic, English and mixed queries).
 */

import type { SearchEvaluationProduct } from "#testing/search-evaluation-product.type";

/** The evaluation catalogue. */
export const SEARCH_EVALUATION_CATALOGUE: readonly SearchEvaluationProduct[] = [
  {
    id: "p01",
    title: "Linen shirt",
    titleAr: "قميص كتان",
    description: "A light summer shirt in linen",
    descriptionAr: "قميص صيفي خفيف من الكتان",
  },
  {
    id: "p02",
    title: "Cotton t-shirt",
    titleAr: "تيشيرت قطن",
    description: "A soft everyday t-shirt in cotton",
    descriptionAr: "تيشيرت ناعم للاستخدام اليومي من القطن",
  },
  {
    id: "p03",
    title: "Wool coat",
    titleAr: "معطف صوف",
    description: "A warm winter coat in wool",
    descriptionAr: "معطف شتوي دافئ من الصوف",
  },
  {
    id: "p04",
    title: "Leather sofa",
    titleAr: "كنبة جلد",
    description: "A three seat sofa in leather",
    descriptionAr: "كنبة بثلاثة مقاعد من الجلد",
  },
  {
    id: "p05",
    title: "Fabric couch",
    titleAr: "أريكة قماش",
    description: "A corner couch in fabric",
    descriptionAr: "أريكة زاوية من القماش",
  },
  {
    id: "p06",
    title: "Oak dining table",
    titleAr: "طاولة طعام بلوط",
    description: "A dining table in solid oak",
    descriptionAr: "طاولة طعام من خشب البلوط الصلب",
  },
  {
    id: "p07",
    title: "Dining chair",
    titleAr: "كرسي طعام",
    description: "A padded dining chair",
    descriptionAr: "كرسي طعام مبطن",
  },
  {
    id: "p08",
    title: "Running shoes",
    titleAr: "حذاء رياضي",
    description: "Light shoes for running",
    descriptionAr: "حذاء خفيف للجري",
  },
  {
    id: "p09",
    title: "Leather sandals",
    titleAr: "صندل جلد",
    description: "Handmade sandals in leather",
    descriptionAr: "صندل مصنوع يدويا من الجلد",
  },
  {
    id: "p10",
    title: "Wireless headphones",
    titleAr: "سماعات لاسلكية",
    description: "Over ear wireless headphones",
    descriptionAr: "سماعات لاسلكية فوق الأذن",
  },
  {
    id: "p11",
    title: "Bluetooth speaker",
    titleAr: "مكبر صوت بلوتوث",
    description: "A portable wireless speaker",
    descriptionAr: "مكبر صوت لاسلكي محمول",
  },
  {
    id: "p12",
    title: "Linen trousers",
    titleAr: "بنطلون كتان",
    description: "Relaxed trousers in linen",
    descriptionAr: "بنطلون مريح من الكتان",
  },
  {
    id: "p13",
    title: "Black abaya",
    titleAr: "عباية سوداء",
    description: "A classic black abaya",
    descriptionAr: "عباية سوداء كلاسيكية",
  },
  {
    id: "p14",
    title: "Prayer rug",
    titleAr: "سجادة صلاة",
    description: "A soft prayer rug",
    descriptionAr: "سجادة صلاة ناعمة",
  },
  {
    id: "p15",
    title: "Arabic coffee set",
    titleAr: "طقم قهوة عربية",
    description: "A coffee set with a dallah and cups",
    descriptionAr: "طقم قهوة مع دلة وفناجين",
  },
  {
    id: "p16",
    title: "Silk scarf",
    titleAr: "وشاح حرير",
    description: "A printed scarf in silk",
    descriptionAr: "وشاح مطبوع من الحرير",
  },
];
