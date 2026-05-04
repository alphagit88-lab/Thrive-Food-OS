import type { PlateItemMacros, ThriveIngredient, ThriveIngredientQuantity } from '../types/types';

type NutritionRecord = Record<string, unknown>;
type NutritionRecordOrigin = 'quantity' | 'ingredient' | 'default_quantity';

interface NutritionCandidate {
  record: NutritionRecord;
  origin: NutritionRecordOrigin;
}

const ZERO_MACROS: PlateItemMacros = {
  protein: 0,
  carbs: 0,
  fats: 0,
  kcal: 0,
};

const NUTRITION_CONTAINER_KEYS = [
  'nutrition',
  'nutrition_info',
  'nutrition_facts',
  'nutritional_info',
  'nutritional_values',
  'macros',
  'macro',
  'macro_totals',
  'nutrients',
  'values',
  'analysis',
  'analysis_result',
  'nutrition_analysis',
  'image_analysis',
  'image_analysis_result',
] as const;

const REFERENCE_GRAMS_KEYS = [
  'reference_grams',
  'reference_g',
  'quantity_grams',
  'grams',
  'gram',
  'weight_grams',
  'weight_g',
  'serving_grams',
  'serving_size_grams',
  'serving_size_g',
  'portion_grams',
  'portion_size_grams',
  'amount_grams',
  'net_weight_grams',
] as const;

const REFERENCE_GRAMS_LABEL_KEYS = [
  'quantity_value',
  'serving_size',
  'serving',
  'portion',
  'reference_amount',
  'weight_label',
] as const;

const PER_100G_HINT_KEYS = [
  'nutrition_basis',
  'basis',
  'macro_basis',
  'serving_basis',
  'reference_basis',
  'reference_unit',
  'per',
  'per_unit',
  'unit',
  'calculation_base',
] as const;

const MACRO_FIELD_KEYS = {
  protein: {
    direct: [
      'protein',
      'proteins',
      'protein_g',
      'proteins_g',
      'protein_grams',
      'proteinGrams',
    ],
    per100: ['protein_per_100g', 'proteinPer100g', 'proteins_per_100g'],
  },
  carbs: {
    direct: [
      'carbs',
      'carbohydrates',
      'carb',
      'carbs_g',
      'carbohydrates_g',
      'carbs_grams',
      'carbohydrate_grams',
      'carbsGrams',
      'carbohydratesGrams',
    ],
    per100: [
      'carbs_per_100g',
      'carbohydrates_per_100g',
      'carbsPer100g',
      'carbohydratesPer100g',
    ],
  },
  fats: {
    direct: ['fat', 'fats', 'fat_g', 'fats_g', 'fat_grams', 'fats_grams', 'fatGrams', 'fatsGrams'],
    per100: ['fat_per_100g', 'fats_per_100g', 'fatPer100g', 'fatsPer100g'],
  },
  kcal: {
    direct: ['kcal', 'calories', 'energy', 'energy_kcal', 'calories_kcal', 'kcal_total', 'kcalTotal'],
    per100: [
      'kcal_per_100g',
      'calories_per_100g',
      'energy_per_100g',
      'kcalPer100g',
      'caloriesPer100g',
    ],
  },
} as const;

const isRecord = (value: unknown): value is NutritionRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const toNumber = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const matchedValue = value.replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
    if (matchedValue) {
      return Number(matchedValue[0]);
    }
  }

  return null;
};

const extractGramsFromString = (value: string) => {
  const matchedValue = value.match(/(\d+(?:\.\d+)?)\s*(?:g|gram|grams)\b/i);
  return matchedValue ? Number(matchedValue[1]) : null;
};

const inferQuantityGrams = (quantity: ThriveIngredientQuantity | null) => {
  if (!quantity) {
    return 0;
  }

  const quantityRecord = quantity as unknown as NutritionRecord;

  for (const key of REFERENCE_GRAMS_KEYS) {
    const matchedValue = toNumber(quantityRecord[key]);
    if (matchedValue !== null && matchedValue > 0) {
      return matchedValue;
    }
  }

  for (const key of REFERENCE_GRAMS_LABEL_KEYS) {
    const rawValue = quantityRecord[key];
    if (typeof rawValue !== 'string') {
      continue;
    }

    const matchedValue = extractGramsFromString(rawValue);
    if (matchedValue !== null && matchedValue > 0) {
      return matchedValue;
    }
  }

  return 0;
};

const isLikelyNutritionContainerKey = (key: string) =>
  NUTRITION_CONTAINER_KEYS.includes(key as (typeof NUTRITION_CONTAINER_KEYS)[number]) ||
  /(nutrition|nutrient|macro|analysis)/i.test(key);

const appendNestedNutritionRecords = (
  source: unknown,
  records: NutritionRecord[],
  seen: Set<NutritionRecord>,
) => {
  if (!isRecord(source)) {
    if (Array.isArray(source)) {
      source.forEach((entry) => appendNestedNutritionRecords(entry, records, seen));
    }

    return;
  }

  if (seen.has(source)) {
    return;
  }

  seen.add(source);
  records.push(source);

  for (const [key, value] of Object.entries(source)) {
    if (!isLikelyNutritionContainerKey(key)) {
      continue;
    }

    appendNestedNutritionRecords(value, records, seen);
  }
};

const getNutritionCandidates = (
  source: unknown,
  origin: NutritionRecordOrigin,
): NutritionCandidate[] => {
  if (!isRecord(source)) {
    return [];
  }

  const records: NutritionRecord[] = [];
  appendNestedNutritionRecords(source, records, new Set<NutritionRecord>());
  return records.map((record) => ({ record, origin }));
};

const inferReferenceGrams = ({ record }: NutritionCandidate, quantityGrams: number) => {
  for (const key of REFERENCE_GRAMS_KEYS) {
    const matchedValue = toNumber(record[key]);
    if (matchedValue !== null && matchedValue > 0) {
      return matchedValue;
    }
  }

  for (const key of REFERENCE_GRAMS_LABEL_KEYS) {
    const rawValue = record[key];
    if (typeof rawValue !== 'string') {
      continue;
    }

    const matchedValue = extractGramsFromString(rawValue);
    if (matchedValue !== null && matchedValue > 0) {
      return matchedValue;
    }
  }

  for (const key of PER_100G_HINT_KEYS) {
    const rawValue = record[key];

    if (typeof rawValue === 'boolean' && rawValue) {
      return 100;
    }

    if (typeof rawValue === 'string' && /\b(?:per\s*)?100\s*g\b/i.test(rawValue)) {
      return 100;
    }

    if (toNumber(rawValue) === 100) {
      return 100;
    }
  }

  if (quantityGrams > 0) {
    // Thrive image-analysis nutrition payloads are provided on a 100g basis unless a
    // more specific reference size is included alongside the macro values.
    return 100;
  }

  return null;
};

const scaleMacroValue = (value: number, quantityGrams: number, referenceGrams: number | null) => {
  if (quantityGrams <= 0 || referenceGrams === null || referenceGrams <= 0) {
    return value;
  }

  return (value * quantityGrams) / referenceGrams;
};

const readMacroValue = (
  candidates: NutritionCandidate[],
  directKeys: readonly string[],
  per100Keys: readonly string[],
  quantityGrams: number,
) => {
  for (const candidate of candidates) {
    for (const key of per100Keys) {
      const matchedValue = toNumber(candidate.record[key]);
      if (matchedValue !== null) {
        return scaleMacroValue(matchedValue, quantityGrams, 100);
      }
    }

    for (const key of directKeys) {
      const matchedValue = toNumber(candidate.record[key]);
      if (matchedValue !== null) {
        return scaleMacroValue(matchedValue, quantityGrams, inferReferenceGrams(candidate, quantityGrams));
      }
    }
  }

  return 0;
};

export const createEmptyMacros = (): PlateItemMacros => ({ ...ZERO_MACROS });

export const getPlateItemMacros = (
  ingredient: ThriveIngredient,
  quantity: ThriveIngredientQuantity | null,
): PlateItemMacros => {
  const quantityGrams = inferQuantityGrams(quantity);
  const nutritionCandidates = [
    ...getNutritionCandidates(quantity, 'quantity'),
    ...getNutritionCandidates(ingredient, 'ingredient'),
    ...getNutritionCandidates(ingredient.default_quantity, 'default_quantity'),
  ];

  return {
    protein: readMacroValue(
      nutritionCandidates,
      MACRO_FIELD_KEYS.protein.direct,
      MACRO_FIELD_KEYS.protein.per100,
      quantityGrams,
    ),
    carbs: readMacroValue(
      nutritionCandidates,
      MACRO_FIELD_KEYS.carbs.direct,
      MACRO_FIELD_KEYS.carbs.per100,
      quantityGrams,
    ),
    fats: readMacroValue(
      nutritionCandidates,
      MACRO_FIELD_KEYS.fats.direct,
      MACRO_FIELD_KEYS.fats.per100,
      quantityGrams,
    ),
    kcal: readMacroValue(
      nutritionCandidates,
      MACRO_FIELD_KEYS.kcal.direct,
      MACRO_FIELD_KEYS.kcal.per100,
      quantityGrams,
    ),
  };
};
