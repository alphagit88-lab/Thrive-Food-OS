import React, { useState } from 'react';
import type { PlateItem, ThriveIngredient } from '../types/types';
import { getPlateItemMacros } from '../utils/nutrition';
import './IngredientModal.css';

interface ModalProps {
  ingredient: ThriveIngredient;
  onClose: () => void;
  onAddToPlate: (item: PlateItem) => void;
}

const formatPrice = (amount: number, currency = 'LKR') =>
  `${currency} ${new Intl.NumberFormat('en-LK', { maximumFractionDigits: 0 }).format(amount)}`;

const formatMetricValue = (value: number) => {
  const roundedValue = Math.round(value * 10) / 10;
  return Number.isInteger(roundedValue) ? `${roundedValue}` : roundedValue.toFixed(1);
};

const formatDisplayName = (value: string) =>
  value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const getQuantityDisplay = (quantityValue: string, quantityGrams: number | null) => {
  if (quantityGrams && quantityGrams > 0) {
    return {
      amount: formatMetricValue(quantityGrams),
      unit: 'Grams',
    };
  }

  const matchedGrams = quantityValue.match(/(\d+(?:\.\d+)?)\s*(?:g|gram|grams)\b/i);
  if (matchedGrams) {
    return {
      amount: formatMetricValue(Number(matchedGrams[1])),
      unit: 'Grams',
    };
  }

  return {
    amount: quantityValue || '-',
    unit: 'Portion',
  };
};

const IngredientModal: React.FC<ModalProps> = ({ ingredient, onClose, onAddToPlate }) => {
  const availableQuantities = ingredient.quantities.filter((quantity) => quantity.is_available !== false);
  const quantityOptions = availableQuantities.length ? availableQuantities : ingredient.quantities;
  const defaultQuantityId = ingredient.default_quantity?.id || quantityOptions[0]?.id || '';
  const defaultVariant = ingredient.variants[0] || '';
  const defaultSpecificationId = ingredient.specifications[0]?.id || '';
  const defaultCookTypeId = ingredient.cook_types[0]?.id || '';

  const [selectedQuantityId, setSelectedQuantityId] = useState(defaultQuantityId);
  const [selectedVariant, setSelectedVariant] = useState(defaultVariant);
  const [selectedSpecificationId, setSelectedSpecificationId] = useState(defaultSpecificationId);
  const [selectedCookTypeId, setSelectedCookTypeId] = useState(defaultCookTypeId);

  const selectedQuantity =
    quantityOptions.find((quantity) => quantity.id === selectedQuantityId) || quantityOptions[0] || null;
  const selectedSpecification =
    ingredient.specifications.find((specification) => specification.id === selectedSpecificationId) ||
    ingredient.specifications[0] ||
    null;
  const selectedCookType =
    ingredient.cook_types.find((cookType) => cookType.id === selectedCookTypeId) ||
    ingredient.cook_types[0] ||
    null;

  const selectedQuantityIndex = quantityOptions.findIndex((quantity) => quantity.id === selectedQuantity?.id);
  const activeQuantityIndex = selectedQuantityIndex >= 0 ? selectedQuantityIndex : 0;
  const quantityDisplay = getQuantityDisplay(
    selectedQuantity?.quantity_value || '',
    selectedQuantity?.quantity_grams || null,
  );
  const selectedMacros = getPlateItemMacros(ingredient, selectedQuantity);

  const handleQuantityStep = (direction: -1 | 1) => {
    if (!quantityOptions.length) {
      return;
    }

    const nextIndex = activeQuantityIndex + direction;
    if (nextIndex < 0 || nextIndex >= quantityOptions.length) {
      return;
    }

    setSelectedQuantityId(quantityOptions[nextIndex].id);
  };

  const handleAddToPlate = () => {
    if (!selectedQuantity) {
      return;
    }

    const newItem: PlateItem = {
      id: `${ingredient.id}-${selectedVariant || 'default'}-${selectedQuantity.id}-${selectedCookType?.id || 'default'}-${Date.now()}`,
      ingredient_id: ingredient.id,
      name: ingredient.name,
      variant: selectedVariant,
      specification: selectedSpecification?.name || '',
      quantity_label: selectedQuantity.quantity_value,
      grams: selectedQuantity.quantity_grams || 0,
      cook_style: selectedCookType?.name || 'Standard',
      price: selectedQuantity.price,
      currency: selectedQuantity.currency,
      image: ingredient.photo_url || null,
      macros: selectedMacros,
    };

    onAddToPlate(newItem);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="ingredient-modal">
        <div className="modal-header">
          <h3>{formatDisplayName(ingredient.name)}</h3>
          <button className="close-x" onClick={onClose} type="button">
            &times;
          </button>
        </div>

        <div className="modal-body">
          {ingredient.variants.length ? (
            <section className="selection-group">
              <label>SELECT VARIANT</label>
              <div className="option-grid wrap">
                {ingredient.variants.map((variant) => (
                  <button
                    key={variant}
                    className={`opt-btn ${selectedVariant === variant ? 'active' : ''}`}
                    onClick={() => setSelectedVariant(variant)}
                    type="button"
                  >
                    {variant}
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {ingredient.show_specification && ingredient.specifications.length ? (
            <section className="selection-group">
              <label>SELECT CUT</label>
              <div className="option-grid wrap">
                {ingredient.specifications.map((specification) => (
                  <button
                    key={specification.id}
                    className={`opt-btn ${selectedSpecification?.id === specification.id ? 'active' : ''}`}
                    onClick={() => setSelectedSpecificationId(specification.id)}
                    type="button"
                  >
                    {specification.name}
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          <section className="selection-group">
            <label>QUANTITY</label>
            {quantityOptions.length ? (
              <div className="quantity-stepper">
                <button
                  className="stepper-btn"
                  disabled={activeQuantityIndex <= 0}
                  onClick={() => handleQuantityStep(-1)}
                  type="button"
                >
                  -
                </button>
                <div className="quantity-display">
                  <strong>{quantityDisplay.amount}</strong>
                  <span>{quantityDisplay.unit}</span>
                </div>
                <button
                  className="stepper-btn"
                  disabled={activeQuantityIndex >= quantityOptions.length - 1}
                  onClick={() => handleQuantityStep(1)}
                  type="button"
                >
                  +
                </button>
              </div>
            ) : (
              <p className="modal-note">This ingredient does not have a quantity configured yet.</p>
            )}
          </section>

          {ingredient.show_cook_type && ingredient.cook_types.length ? (
            <section className="selection-group">
              <label>COOK STYLE</label>
              <div className="option-grid wrap">
                {ingredient.cook_types.map((cookType) => (
                  <button
                    key={cookType.id}
                    className={`opt-btn ${selectedCookType?.id === cookType.id ? 'active' : ''}`}
                    onClick={() => setSelectedCookTypeId(cookType.id)}
                    type="button"
                  >
                    {cookType.name}
                  </button>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <div className="modal-macros-row">
          <div className="m-unit">
            <strong>{formatMetricValue(selectedMacros.protein)}g</strong>
            <span>Protein</span>
          </div>
          <div className="m-unit">
            <strong>{formatMetricValue(selectedMacros.carbs)}g</strong>
            <span>Carbs</span>
          </div>
          <div className="m-unit">
            <strong>{formatMetricValue(selectedMacros.fats)}g</strong>
            <span>Fats</span>
          </div>
          <div className="m-unit">
            <strong>{formatMetricValue(selectedMacros.kcal)}</strong>
            <span>Kcal</span>
          </div>
        </div>

        <div className="modal-footer">
          <div className="price-display">
            <span>Item Price</span>
            <strong>{selectedQuantity ? formatPrice(selectedQuantity.price, selectedQuantity.currency) : 'Pending'}</strong>
          </div>
          <div className="modal-actions">
            <button className="cancel-btn" onClick={onClose} type="button">
              Cancel
            </button>
            <button className="add-plate-btn" onClick={handleAddToPlate} disabled={!selectedQuantity} type="button">
              Add to Plate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IngredientModal;
