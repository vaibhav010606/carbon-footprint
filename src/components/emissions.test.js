/**
 * Pure unit tests for emission calculation logic extracted from Calculator.jsx.
 * These tests verify the core business logic without needing React rendering.
 */

import { describe, it, expect } from 'vitest';

// --- Emission Factors (mirrored from Calculator.jsx) ---
const EMISSION_FACTORS = {
  transport: {
    petrol_car: { multiplier: 0.192 },
    ev:         { multiplier: 0.053 },
    bus:        { multiplier: 0.105 },
    metro:      { multiplier: 0.041 },
    domestic_flight: { multiplier: 0.255 },
  },
  food: {
    beef:        { multiplier: 27.0 },
    chicken:     { multiplier: 6.9 },
    vegetarian:  { multiplier: 2.0 },
    vegan:       { multiplier: 1.5 },
  },
  energy: {
    electricity: { multiplier: 0.39 },
    gas:         { multiplier: 0.2 },
  },
  positive: {
    bike:        { multiplier: -0.192 },
    plant_tree:  { multiplier: -20.0 },
    recycle:     { multiplier: -0.8 },
  },
};

/**
 * Calculates CO2e emission for an activity.
 * @param {string} category - Top-level category key.
 * @param {string} sub - Sub-category key.
 * @param {number|string} amount - Quantity of the activity.
 * @returns {number} Estimated CO2e in kg, or 0 if invalid.
 */
function calculateCO2(category, sub, amount) {
  if (!category || !sub || !amount || isNaN(amount)) return 0;
  const factor = EMISSION_FACTORS[category]?.[sub];
  if (!factor) return 0;
  return Number(amount) * factor.multiplier;
}

describe('Emission Calculation Logic', () => {
  describe('Transport emissions', () => {
    it('calculates petrol car emissions correctly', () => {
      const result = calculateCO2('transport', 'petrol_car', 100);
      expect(result).toBeCloseTo(19.2, 1);
    });

    it('calculates EV emissions correctly (lower than petrol)', () => {
      const ev = calculateCO2('transport', 'ev', 100);
      const petrol = calculateCO2('transport', 'petrol_car', 100);
      expect(ev).toBeCloseTo(5.3, 1);
      expect(ev).toBeLessThan(petrol);
    });

    it('calculates flight emissions correctly', () => {
      const result = calculateCO2('transport', 'domestic_flight', 500);
      expect(result).toBeCloseTo(127.5, 1);
    });

    it('metro has the lowest transport emission', () => {
      const metro = calculateCO2('transport', 'metro', 10);
      const bus = calculateCO2('transport', 'bus', 10);
      const car = calculateCO2('transport', 'petrol_car', 10);
      expect(metro).toBeLessThan(bus);
      expect(bus).toBeLessThan(car);
    });
  });

  describe('Food emissions', () => {
    it('beef has highest food emission', () => {
      const beef = calculateCO2('food', 'beef', 1);
      const chicken = calculateCO2('food', 'chicken', 1);
      const vegan = calculateCO2('food', 'vegan', 1);
      expect(beef).toBeGreaterThan(chicken);
      expect(chicken).toBeGreaterThan(vegan);
    });

    it('calculates beef CO2 correctly', () => {
      expect(calculateCO2('food', 'beef', 1)).toBeCloseTo(27.0, 1);
    });

    it('vegan meal has lowest food emission', () => {
      expect(calculateCO2('food', 'vegan', 1)).toBeCloseTo(1.5, 1);
    });
  });

  describe('Energy emissions', () => {
    it('calculates electricity consumption correctly', () => {
      expect(calculateCO2('energy', 'electricity', 100)).toBeCloseTo(39.0, 1);
    });

    it('natural gas has lower emission than electricity per kWh', () => {
      const gas = calculateCO2('energy', 'gas', 100);
      const electricity = calculateCO2('energy', 'electricity', 100);
      expect(gas).toBeLessThan(electricity);
    });
  });

  describe('Positive (offset) activities', () => {
    it('biking returns negative emission (offset)', () => {
      const result = calculateCO2('positive', 'bike', 10);
      expect(result).toBeLessThan(0);
      expect(result).toBeCloseTo(-1.92, 1);
    });

    it('planting tree has largest offset', () => {
      const tree = calculateCO2('positive', 'plant_tree', 1);
      const recycle = calculateCO2('positive', 'recycle', 1);
      expect(tree).toBeLessThan(recycle);
    });
  });

  describe('Edge cases and validation', () => {
    it('returns 0 for empty category', () => {
      expect(calculateCO2('', 'petrol_car', 10)).toBe(0);
    });

    it('returns 0 for empty amount', () => {
      expect(calculateCO2('transport', 'petrol_car', '')).toBe(0);
    });

    it('returns 0 for NaN amount', () => {
      expect(calculateCO2('transport', 'petrol_car', 'abc')).toBe(0);
    });

    it('returns 0 for unknown category', () => {
      expect(calculateCO2('unknown', 'petrol_car', 10)).toBe(0);
    });

    it('returns 0 for unknown sub-category', () => {
      expect(calculateCO2('transport', 'unknown_vehicle', 10)).toBe(0);
    });

    it('handles zero amount', () => {
      expect(calculateCO2('transport', 'petrol_car', 0)).toBe(0);
    });

    it('scales linearly with amount', () => {
      const single = calculateCO2('food', 'beef', 1);
      const double = calculateCO2('food', 'beef', 2);
      expect(double).toBeCloseTo(single * 2, 5);
    });
  });
});

describe('EcoGarden Stage Logic', () => {
  const STAGES = [
    { minPoints: 0,    maxPoints: 200,      title: 'The Little Sprout' },
    { minPoints: 201,  maxPoints: 600,      title: 'The Young Sapling' },
    { minPoints: 601,  maxPoints: 1200,     title: 'The Flourishing Tree' },
    { minPoints: 1201, maxPoints: Infinity, title: 'The Eternal Guardian' },
  ];

  const getStage = (points) =>
    STAGES.find(s => points >= s.minPoints && points <= s.maxPoints) || STAGES[3];

  it('new user (0 pts) is Little Sprout', () => {
    expect(getStage(0).title).toBe('The Little Sprout');
  });

  it('boundary (200 pts) still Little Sprout', () => {
    expect(getStage(200).title).toBe('The Little Sprout');
  });

  it('201 pts = Young Sapling', () => {
    expect(getStage(201).title).toBe('The Young Sapling');
  });

  it('601 pts = Flourishing Tree', () => {
    expect(getStage(601).title).toBe('The Flourishing Tree');
  });

  it('1201+ pts = Eternal Guardian', () => {
    expect(getStage(1201).title).toBe('The Eternal Guardian');
    expect(getStage(9999).title).toBe('The Eternal Guardian');
  });
});
