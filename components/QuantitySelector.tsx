'use client'

import { MIN_QUANTITY, MAX_QUANTITY } from '@/lib/constants'
import { clamp } from '@/lib/utils'

interface QuantitySelectorProps {
  quantity: number
  onQuantityChange: (newQuantity: number) => void
  disabled?: boolean
  className?: string
  showLabel?: boolean
}

/**
 * Reusable quantity selector component
 * Following DRY principle - single component for quantity selection
 */
export default function QuantitySelector({
  quantity,
  onQuantityChange,
  disabled = false,
  className = '',
  showLabel = true,
}: QuantitySelectorProps) {
  const handleIncrement = () => {
    if (quantity < MAX_QUANTITY) {
      const newQuantity = clamp(quantity + 1, MIN_QUANTITY, MAX_QUANTITY)
      onQuantityChange(newQuantity)
    }
  }

  const handleDecrement = () => {
    if (quantity > MIN_QUANTITY) {
      const newQuantity = clamp(quantity - 1, MIN_QUANTITY, MAX_QUANTITY)
      onQuantityChange(newQuantity)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQty = parseInt(e.target.value) || MIN_QUANTITY
    const clampedQty = clamp(newQty, MIN_QUANTITY, MAX_QUANTITY)
    onQuantityChange(clampedQty)
  }

  return (
    <div className={className}>
      {showLabel && (
        <label htmlFor="quantity-input" className="block text-sm font-medium text-gray-700 mb-2">
          Quantity
        </label>
      )}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={quantity <= MIN_QUANTITY || disabled}
          className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Decrease quantity"
        >
          −
        </button>
        <input
          id="quantity-input"
          type="number"
          min={MIN_QUANTITY}
          max={MAX_QUANTITY}
          value={quantity}
          onChange={handleInputChange}
          disabled={disabled}
          className="w-16 text-center border border-gray-300 rounded px-2 py-1"
        />
        <button
          type="button"
          onClick={handleIncrement}
          disabled={quantity >= MAX_QUANTITY || disabled}
          className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>
    </div>
  )
}

