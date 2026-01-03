
/**
 * Measurement Utility Functions
 * Handles conversion between Imperial (lbs) and Metric (kg) systems.
 * 
 * Canonical Storage Unit: LBS (Pounds)
 * All weight data in the database is stored in pounds.
 */

export type WeightUnit = 'lb' | 'kg';

const KG_TO_LBS = 2.20462;

/**
 * Converts a weight value from the source unit to the target unit.
 * 
 * @param value The weight value to convert
 * @param fromUnit The unit of the input value
 * @param toUnit The unit to convert to
 * @returns The converted value
 */
export function convertWeight(value: number, fromUnit: WeightUnit, toUnit: WeightUnit): number {
    if (fromUnit === toUnit) {
        return value;
    }

    if (fromUnit === 'lb' && toUnit === 'kg') {
        return value / KG_TO_LBS;
    }

    if (fromUnit === 'kg' && toUnit === 'lb') {
        return value * KG_TO_LBS;
    }

    return value;
}

/**
 * Formats a weight value for display, handling rounding.
 * 
 * @param value The weight value in the target unit
 * @param unit The unit to display
 * @param precision Number of decimal places (default 1)
 * @returns Formatted string with unit label
 */
export function formatWeight(value: number, unit: WeightUnit, precision: number = 1): string {
    // Round to precision
    const multiplier = Math.pow(10, precision);
    const rounded = Math.round(value * multiplier) / multiplier;

    return `${rounded} ${unit}`;
}

/**
 * Helper to get the display value from a stored value (lbs) based on user preference.
 * 
 * @param storedValueLbs The value from the database (in lbs)
 * @param targetUnit The user's preferred unit
 * @returns The value converted to the target unit
 */
export function getDisplayWeight(storedValueLbs: number, targetUnit: WeightUnit): number {
    return convertWeight(storedValueLbs, 'lb', targetUnit);
}

/**
 * Helper to get the storage value (lbs) from a user input value.
 * 
 * @param inputValue The value entered by the user
 * @param inputUnit The user's preferred unit (which they derived the input from)
 * @returns The value converted to lbs for storage
 */
export function getStorageWeight(inputValue: number, inputUnit: WeightUnit): number {
    return convertWeight(inputValue, inputUnit, 'lb');
}
