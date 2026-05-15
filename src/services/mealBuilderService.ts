import { requestWithHostedCatalogFallback, resolveApiAssetUrl } from './apiClient';
import type {
  ThriveIngredient,
  ThriveIngredientCategory,
  ThriveIngredientsResponse,
  ThriveLocationsResponse,
} from '../types/types';

type ApiRecord = Record<string, unknown>;

const IMAGE_FIELD_KEYS = [
  'photo_url',
  'image_url',
  'imageUrl',
  'image',
  'thumbnail_url',
  'thumbnailUrl',
  'thumbnail',
  'url',
] as const;

const IMAGE_COLLECTION_KEYS = ['photos', 'images', 'gallery'] as const;

const isRecord = (value: unknown): value is ApiRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const resolveImageValue = (value: unknown, apiOrigin?: string): string | null => {
  if (typeof value === 'string' && value.trim()) {
    return resolveApiAssetUrl(value, apiOrigin) || value;
  }

  if (!isRecord(value)) {
    return null;
  }

  for (const key of IMAGE_FIELD_KEYS) {
    const matchedValue = resolveImageValue(value[key], apiOrigin);
    if (matchedValue) {
      return matchedValue;
    }
  }

  return null;
};

const resolveImageCollection = (value: unknown, apiOrigin?: string): string | null => {
  if (!Array.isArray(value)) {
    return null;
  }

  for (const entry of value) {
    const matchedValue = resolveImageValue(entry, apiOrigin);
    if (matchedValue) {
      return matchedValue;
    }
  }

  return null;
};

const resolveIngredientImage = (ingredient: ThriveIngredient, apiOrigin?: string) => {
  const ingredientRecord = ingredient as ThriveIngredient & ApiRecord;

  for (const key of IMAGE_FIELD_KEYS) {
    const matchedValue = resolveImageValue(ingredientRecord[key], apiOrigin);
    if (matchedValue) {
      return matchedValue;
    }
  }

  for (const key of IMAGE_COLLECTION_KEYS) {
    const matchedValue = resolveImageCollection(ingredientRecord[key], apiOrigin);
    if (matchedValue) {
      return matchedValue;
    }
  }

  return null;
};

const hydrateIngredient = (
  ingredient: ThriveIngredient,
  category: ThriveIngredientCategory,
  apiOrigin?: string,
): ThriveIngredient => {
  const photos = (ingredient.photos || []).map((photo) => ({
    ...photo,
    photo_url: resolveApiAssetUrl(photo.photo_url, apiOrigin) || photo.photo_url,
  }));

  const hydratedIngredient: ThriveIngredient = {
    ...ingredient,
    variants: Array.isArray(ingredient.variants)
      ? ingredient.variants
          .map((variant) => String(variant || '').trim())
          .filter(Boolean)
      : [],
    show_specification: category.show_specification,
    show_cook_type: category.show_cook_type,
    photos,
    photo_url: ingredient.photo_url,
  };

  return {
    ...hydratedIngredient,
    photo_url: resolveIngredientImage(
      {
        ...hydratedIngredient,
        photo_url:
          resolveApiAssetUrl(hydratedIngredient.photo_url, apiOrigin) || hydratedIngredient.photo_url,
        photos,
      },
      apiOrigin,
    ),
  };
};

export const getFoodOsLocations = async () => {
  const { response } = await requestWithHostedCatalogFallback<ThriveLocationsResponse>({
    method: 'get',
    url: '/integrations/thrive-food-os/locations',
  });
  return response.data.data;
};

export const getFoodOsIngredients = async (locationId: string) => {
  const { response, apiOrigin } = await requestWithHostedCatalogFallback<ThriveIngredientsResponse>({
    method: 'get',
    url: '/integrations/thrive-food-os/ingredients',
    params: { location_id: locationId },
    headers: { 'X-Location-Id': locationId },
  });

  return {
    ...response.data,
    data: (response.data.data || []).map((category) => ({
      ...category,
      ingredients: (category.ingredients || []).map((ingredient) =>
        hydrateIngredient(ingredient, category, apiOrigin),
      ),
    })),
  };
};
