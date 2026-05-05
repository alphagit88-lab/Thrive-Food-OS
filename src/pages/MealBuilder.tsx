import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import IngredientModal from '../modals/IngredientModal';
import foodPlate from '../assets/food-plate.png';
import { getFoodOsIngredients, getFoodOsLocations } from '../services/mealBuilderService';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  addPlateItem,
  removePlateItem,
  selectLocation,
  setCheckoutDraft,
  setMealName,
  setSelectedDelivery,
} from '../store/slices/mealBuilderSlice';
import { createEmptyMacros, getPlateItemMacros } from '../utils/nutrition';
import type {
  CustomerOrderDraft,
  PlateItem,
  ThriveIngredient,
  ThriveIngredientCategory,
  ThriveIngredientQuantity,
  ThriveIngredientsMeta,
  ThriveIngredientsResponse,
  ThriveLocation,
} from '../types/types';
import './MealBuilder.css';

const MIN_CHECKOUT_ITEMS = 3;

const toDisplayText = (value: string) =>
  value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const formatPrice = (amount: number, currency = 'LKR') =>
  `${currency} ${new Intl.NumberFormat('en-LK', { maximumFractionDigits: 0 }).format(amount)}`;

const PREVIEW_100G_QUANTITY: ThriveIngredientQuantity = {
  id: 'preview-100g',
  quantity_value: '100g',
  quantity_grams: 100,
  price: 0,
  is_available: true,
  currency: 'LKR',
};

const formatMacroValue = (value: number) => {
  const roundedValue = Math.round(value * 10) / 10;

  if (roundedValue === 0) {
    return '0';
  }

  return Number.isInteger(roundedValue) ? `${roundedValue}` : roundedValue.toFixed(1);
};

const formatGramsLabel = (grams: number) => {
  if (!grams) {
    return '';
  }

  return `${Number.isInteger(grams) ? grams : Number(grams.toFixed(1))}g`;
};

const formatPlateItemQuantity = (item: PlateItem) => {
  const gramsLabel = formatGramsLabel(item.grams);

  if (!gramsLabel) {
    return item.quantity_label;
  }

  const normalizedQuantity = item.quantity_label.replace(/\s+/g, '').toLowerCase();

  if (normalizedQuantity === gramsLabel.toLowerCase()) {
    return gramsLabel;
  }

  return item.quantity_label ? `${item.quantity_label} / ${gramsLabel}` : gramsLabel;
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof error.response === 'object' &&
    error.response !== null &&
    'data' in error.response &&
    typeof error.response.data === 'object' &&
    error.response.data !== null
  ) {
    const data = error.response.data as { error?: string; message?: string };
    return data.error || data.message || fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};

const formatIngredientKcalPer100g = (ingredient: ThriveIngredient) => {
  const kcalPer100g = getPlateItemMacros(ingredient, PREVIEW_100G_QUANTITY).kcal;

  if (kcalPer100g <= 0) {
    return 'kcal/100g pending';
  }

  return `${formatMacroValue(kcalPer100g)} kcal/100g`;
};

const MealBuilder: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const catalogCacheRef = useRef<Record<string, ThriveIngredientsResponse>>({});
  const checkoutTimeoutRef = useRef<number | null>(null);
  const [locations, setLocations] = useState<ThriveLocation[]>([]);
  const [catalog, setCatalog] = useState<ThriveIngredientCategory[]>([]);
  const [catalogMeta, setCatalogMeta] = useState<ThriveIngredientsMeta | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [activeIngredient, setActiveIngredient] = useState<ThriveIngredient | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);
  const [isLoadingIngredients, setIsLoadingIngredients] = useState(false);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const selectedLocationId = useAppSelector((state) => state.mealBuilder.selectedLocationId);
  const plateItems = useAppSelector((state) => state.mealBuilder.plateItems);
  const selectedDelivery = useAppSelector((state) => state.mealBuilder.selectedDelivery);
  const mealName = useAppSelector((state) => state.mealBuilder.mealName);

  useEffect(() => {
    let isMounted = true;

    const getCatalogForLocation = async (locationId: string) => {
      if (catalogCacheRef.current[locationId]) {
        return catalogCacheRef.current[locationId];
      }

      const response = await getFoodOsIngredients(locationId);
      catalogCacheRef.current[locationId] = response;
      return response;
    };

    const loadLocations = async () => {
      setIsLoadingLocations(true);
      setLoadError('');

      try {
        const locationData = await getFoodOsLocations();
        if (!isMounted) {
          return;
        }

        setLocations(locationData);

        if (!locationData.length) {
          dispatch(selectLocation(''));
          return;
        }

        if (selectedLocationId && locationData.some((location) => location.id === selectedLocationId)) {
          return;
        }

        let preferredLocationId = locationData[0].id;
        for (const location of locationData) {
          const response = await getCatalogForLocation(location.id);
          if (!isMounted) {
            return;
          }

          if ((response.meta.total_ingredients || 0) > 0) {
            preferredLocationId = location.id;
            break;
          }
        }

        dispatch(selectLocation(preferredLocationId));
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setLoadError(getErrorMessage(error, 'Unable to load locations from Thrive_Backend.'));
        setLocations([]);
      } finally {
        if (isMounted) {
          setIsLoadingLocations(false);
        }
      }
    };

    void loadLocations();

    return () => {
      isMounted = false;
    };
  }, [dispatch, selectedLocationId]);

  useEffect(() => {
    if (!selectedLocationId) {
      setCatalog([]);
      setCatalogMeta(null);
      setSelectedCategoryId('');
      return;
    }

    let isMounted = true;

    const loadIngredients = async () => {
      setIsLoadingIngredients(true);
      setLoadError('');

      try {
        const response =
          catalogCacheRef.current[selectedLocationId] || (await getFoodOsIngredients(selectedLocationId));

        catalogCacheRef.current[selectedLocationId] = response;

        if (!isMounted) {
          return;
        }

        setCatalog(response.data);
        setCatalogMeta(response.meta);
        setSelectedCategoryId((currentCategoryId) => {
          const currentCategoryExists = response.data.some(
            (category) => category.category_id === currentCategoryId,
          );

          if (currentCategoryExists) {
            return currentCategoryId;
          }

          const firstCategoryWithIngredients = response.data.find(
            (category) => category.ingredients.length > 0,
          );

          return firstCategoryWithIngredients?.category_id || response.data[0]?.category_id || '';
        });
        setActiveIngredient(null);
        setModalOpen(false);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setCatalog([]);
        setCatalogMeta(null);
        setLoadError(getErrorMessage(error, 'Unable to load location-wise ingredients.'));
      } finally {
        if (isMounted) {
          setIsLoadingIngredients(false);
        }
      }
    };

    void loadIngredients();

    return () => {
      isMounted = false;
    };
  }, [selectedLocationId]);

  useEffect(() => {
    return () => {
      if (checkoutTimeoutRef.current !== null) {
        window.clearTimeout(checkoutTimeoutRef.current);
      }
    };
  }, []);

  const currentLocation =
    locations.find((location) => location.id === selectedLocationId) || catalogMeta?.location || null;
  const selectedCategory =
    catalog.find((category) => category.category_id === selectedCategoryId) || catalog[0] || null;
  const categoryIngredients = selectedCategory?.ingredients || [];
  const totalPrice = plateItems.reduce((sum, item) => sum + item.price, 0);
  const plateCurrency = currentLocation?.currency || plateItems[0]?.currency || 'LKR';
  const hasCheckoutMinimum = plateItems.length >= MIN_CHECKOUT_ITEMS;
  const totalMacros = plateItems.reduce((totals, item) => {
    totals.protein += item.macros.protein || 0;
    totals.carbs += item.macros.carbs || 0;
    totals.fats += item.macros.fats || 0;
    totals.kcal += item.macros.kcal || 0;
    return totals;
  }, createEmptyMacros());

  const findIngredientById = (ingredientId: string) => {
    for (const category of catalog) {
      const matchedIngredient = category.ingredients.find((ingredient) => ingredient.id === ingredientId);
      if (matchedIngredient) {
        return matchedIngredient;
      }
    }

    return null;
  };

  const openIngredientModal = (ingredient: ThriveIngredient) => {
    setActiveIngredient(ingredient);
    setModalOpen(true);
  };

  const handleDragStart = (event: React.DragEvent, ingredient: ThriveIngredient) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('ingredientId', ingredient.id);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const handleDropOnPlate = (event: React.DragEvent) => {
    event.preventDefault();

    const ingredientId = event.dataTransfer.getData('ingredientId');
    const ingredient = findIngredientById(ingredientId);

    if (ingredient) {
      openIngredientModal(ingredient);
    }
  };

  const handleAddToPlate = (item: PlateItem) => {
    dispatch(addPlateItem(item));
  };

  const handleRemoveItem = (id: string) => {
    dispatch(removePlateItem(id));
  };

  const handleProceedToCheckout = () => {
    if (!hasCheckoutMinimum || isCheckoutLoading || !currentLocation) {
      return;
    }

    const draft: CustomerOrderDraft = {
      meal_name: mealName.trim() || 'Custom Thrive Plate',
      location_id: currentLocation.id,
      location_name: currentLocation.name,
      total_price: totalPrice,
      delivery_type: selectedDelivery,
      plate_items: plateItems,
      created_at: new Date().toISOString(),
    };

    dispatch(setCheckoutDraft(draft));
    setIsCheckoutLoading(true);

    checkoutTimeoutRef.current = window.setTimeout(() => {
      setIsCheckoutLoading(false);
      navigate('/order');
    }, 300);
  };

  const instructionText = isLoadingIngredients
    ? 'LOADING INGREDIENTS FROM THRIVE_BACKEND'
    : isCheckoutLoading
      ? 'OPENING CHECKOUT...'
    : hasCheckoutMinimum
      ? 'READY FOR CHECKOUT. ADD OR REMOVE ITEMS ANYTIME'
      : 'DRAG INGREDIENTS TO YOUR PLATE';

  return (
    <div>
      <div className="builder-page">
        <aside className="ingredients-sidebar">
          <div className="location-panel">
            <span className="location-label">LOCATION</span>
            <select
              className="location-select"
              value={selectedLocationId}
              onChange={(event) => dispatch(selectLocation(event.target.value))}
              disabled={isLoadingLocations || !locations.length}
            >
              {locations.length ? null : <option value="">No locations found</option>}
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>

          <h5 className="sidebar-title">INGREDIENTS</h5>
          <div className="category-grid">
            {catalog.map((category) => (
              <button
                key={category.category_id || category.category_name}
                className={`cat-btn ${selectedCategory?.category_id === category.category_id ? 'active' : ''}`}
                onClick={() => setSelectedCategoryId(category.category_id || '')}
              >
                <span>{toDisplayText(category.category_name)}</span>
              </button>
            ))}
          </div>

          {loadError ? <div className="builder-feedback error">{loadError}</div> : null}

          <div className="ingredient-list">
            {isLoadingIngredients ? (
              <div className="ingredient-empty-state">Loading location-wise ingredient catalog...</div>
            ) : categoryIngredients.length ? (
              categoryIngredients.map((ingredient) => {
                return (
                  <div
                    key={ingredient.id}
                    className="ingredient-card"
                    draggable
                    onDragStart={(event) => handleDragStart(event, ingredient)}
                    onClick={() => openIngredientModal(ingredient)}
                  >
                    <div className="ing-info">
                      <span className="ing-name">{ingredient.name}</span>
                      <span className="ing-cal">{formatIngredientKcalPer100g(ingredient)}</span>
                    </div>
                    <button
                      className="drag-btn"
                      onClick={(event) => {
                        event.stopPropagation();
                        openIngredientModal(ingredient);
                      }}
                    >
                      Drag
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="ingredient-empty-state">
                {selectedCategory
                  ? `No ingredients are available in ${currentLocation?.name || 'this location'} for ${toDisplayText(
                      selectedCategory.category_name,
                    )}.`
                  : 'Choose a location to load the ingredient catalog.'}
              </div>
            )}
          </div>
        </aside>

        <main className="plate-container">
          <p className="instruction-text">{instructionText}</p>

          <div className="main-plate-view" onDragOver={handleDragOver} onDrop={handleDropOnPlate}>
            <div className="plate-circle">
              <div className="plate-logo">THRIVE</div>
              {plateItems.map((item, index) => {
                const angle = index * 40;
                const radius = 40;
                const radians = (angle * Math.PI) / 180;
                const top = 50 + radius * Math.sin(radians);
                const left = 50 + radius * Math.cos(radians);
                const positionStyle = {
                  position: 'absolute' as const,
                  top: `${top}%`,
                  left: `${left}%`,
                  transform: 'translate(-50%, -50%)',
                  zIndex: index + 1,
                };

                if (item.image) {
                  return (
                    <img
                      key={item.id}
                      src={item.image}
                      alt={item.name}
                      className="placed-food"
                      style={{
                        ...positionStyle,
                        width: '150px',
                        height: '150px',
                        objectFit: 'contain',
                      }}
                    />
                  );
                }

                return (
                  <div key={item.id} className="placed-food-fallback" style={positionStyle}>
                    {item.name}
                  </div>
                );
              })}
            </div>
            <p className="build-step">
              Build your meal ({plateItems.length} item{plateItems.length !== 1 ? 's' : ''})
            </p>
          </div>

          <div className="live-macros">
            <div className="m-stat">
              <strong>{formatMacroValue(totalMacros.protein)}g</strong>
              <span>Protein</span>
            </div>
            <div className="m-stat">
              <strong>{formatMacroValue(totalMacros.carbs)}g</strong>
              <span>Carbs</span>
            </div>
            <div className="m-stat">
              <strong>{formatMacroValue(totalMacros.fats)}g</strong>
              <span>Fats</span>
            </div>
            <div className="m-stat">
              <strong>{formatMacroValue(totalMacros.kcal)}</strong>
              <span>Kcal</span>
            </div>
          </div>

          <div className="suggested-section">
            <p className="suggested-label">SUGGESTED DISHES BASED ON YOUR PLATE</p>
            <div className="suggestion-card">
              <div className="card-badge">{currentLocation?.name || 'LIVE CATALOG'}</div>

              <div className="card-main-content">
                <img src={foodPlate} alt="Featured dish" className="suggestion-img" />
                <div className="suggestion-text">
                  <h4>{selectedCategory ? `${toDisplayText(selectedCategory.category_name)} spotlight` : 'Choose a location'}</h4>
                  <p className="description">
                    {categoryIngredients.length
                      ? `Live Thrive_Backend ingredients available for ${currentLocation?.name || 'this kitchen'}: ${categoryIngredients
                          .slice(0, 4)
                          .map((ingredient) => ingredient.name)
                          .join(', ')}.`
                      : 'Select a location with available ingredients to start building your plate.'}
                  </p>
                </div>
              </div>

              <ul className="ingredient-bullets">
                {categoryIngredients.slice(0, 4).map((ingredient) => (
                  <li key={ingredient.id}>
                    <span></span>
                    {ingredient.name} {ingredient.default_quantity?.quantity_value || ''}
                  </li>
                ))}
              </ul>

              <div className="suggestion-macros-row">
                <div className="s-macro">
                  <strong>{catalogMeta?.total_categories ?? 0}</strong>
                  <span>Categories</span>
                </div>
                <div className="s-macro">
                  <strong>{catalogMeta?.total_ingredients ?? 0}</strong>
                  <span>Ingredients</span>
                </div>
                <div className="s-macro">
                  <strong>{currentLocation?.location_type || 'Kitchen'}</strong>
                  <span>Location</span>
                </div>
                <div className="s-macro">
                  <strong>{plateItems.length}</strong>
                  <span>On Plate</span>
                </div>
              </div>

              <div className="suggestion-footer">
                <span className="suggestion-price">{formatPrice(totalPrice, plateCurrency)}</span>
                <button className="buy-now-btn" onClick={handleProceedToCheckout}>
                  Buy Now
                </button>
              </div>
            </div>
          </div>
        </main>

        <aside className="order-summary">
          <div className="summary-header">
            <span className="plate-title">Your Plate</span>
            <span className="item-count">
              {plateItems.length} Item{plateItems.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="selected-items-list">
            {plateItems.length ? (
              plateItems.map((item) => (
                <div key={item.id} className="selected-item">
                  <div className="item-main">
                    <strong>{item.name}</strong>
                    <span>{formatPlateItemQuantity(item)}</span>
                  </div>
                  <div className="item-tags">
                    <span className="tag-accent">{item.specification || item.quantity_label}</span>
                    <span className="tag-accent">{item.cook_style}</span>
                    <button className="remove-item" onClick={() => handleRemoveItem(item.id)}>
                      &times;
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="selected-items-empty">Drag ingredients here to start building your meal.</div>
            )}
          </div>

          <div className="total-box">
            <span className="total-label">TOTAL</span>
            <span className="total-price">{formatPrice(totalPrice, plateCurrency)}</span>
          </div>

          <div className="name-meal-input">
            <p>Every meal you build gets a name and a place in our community.</p>
            <input
              type="text"
              placeholder="Name your meal"
              value={mealName}
              onChange={(event) => dispatch(setMealName(event.target.value))}
            />
          </div>

          <div className="delivery-options">
            <p>Your meal can be delivered at your convenience.</p>
            <div className="delivery-buttons">
              <button
                className={`delivery-btn order-now-btn ${selectedDelivery === 'now' ? 'active' : ''}`}
                onClick={() => dispatch(setSelectedDelivery('now'))}
              >
                <div className="opt-text">
                  <strong>Order Now</strong>
                  <span>Delivered in 45 Min</span>
                </div>
                {selectedDelivery === 'now' && <div className="check-circle">&#10003;</div>}
              </button>

              <button
                className={`delivery-btn ${selectedDelivery === 'schedule' ? 'active' : ''}`}
                onClick={() => dispatch(setSelectedDelivery('schedule'))}
              >
                <div className="opt-text">
                  <strong>Schedule</strong>
                  <span>Pick a time</span>
                </div>
                {selectedDelivery === 'schedule' && <div className="check-circle">&#10003;</div>}
              </button>
            </div>
          </div>

          <button
            className="add-more-btn"
            disabled={!hasCheckoutMinimum || isCheckoutLoading}
            onClick={handleProceedToCheckout}
          >
            {isCheckoutLoading
              ? 'Loading...'
              : hasCheckoutMinimum
                ? 'Complete - Proceed to Checkout'
              : `Add ${Math.max(0, MIN_CHECKOUT_ITEMS - plateItems.length)} More item${
                  MIN_CHECKOUT_ITEMS - plateItems.length === 1 ? '' : 's'
                } to Order`}
          </button>
        </aside>
      </div>

      {isModalOpen && activeIngredient ? (
        <IngredientModal
          key={activeIngredient.id}
          ingredient={activeIngredient}
          onClose={() => setModalOpen(false)}
          onAddToPlate={handleAddToPlate}
        />
      ) : null}
    </div>
  );
};

export default MealBuilder;
