/**
 * Date Utilities Tests
 * 
 * Unit tests for date parsing, formatting, and calculation functions.
 */

import { describe, it, expect } from '@jest/globals';
import {
  parseUTC,
  daysDifference,
  formatISO,
  formatHuman,
  minDate,
  maxDate,
  isValidDate,
} from '../lib/date';

describe('Date Utilities', () => {
  describe('parseUTC', () => {
    it('should parse valid ISO date strings', () => {
      const date = parseUTC('2024-01-15T10:30:00Z');
      expect(date).toBeInstanceOf(Date);
      expect(date?.toISOString()).toBe('2024-01-15T10:30:00.000Z');
    });

    it('should return null for invalid date strings', () => {
      expect(parseUTC('invalid-date')).toBeNull();
      expect(parseUTC('')).toBeNull();
      expect(parseUTC(null)).toBeNull();
      expect(parseUTC(undefined)).toBeNull();
    });

    it('should handle various date formats', () => {
      expect(parseUTC('2024-01-15')).toBeInstanceOf(Date);
      expect(parseUTC('2024/01/15')).toBeInstanceOf(Date);
      expect(parseUTC('Jan 15, 2024')).toBeInstanceOf(Date);
    });
  });

  describe('daysDifference', () => {
    it('should calculate difference between two dates', () => {
      const date1 = new Date('2024-01-01');
      const date2 = new Date('2024-01-11');
      expect(daysDifference(date1, date2)).toBe(10);
    });

    it('should return absolute difference', () => {
      const date1 = new Date('2024-01-11');
      const date2 = new Date('2024-01-01');
      expect(daysDifference(date1, date2)).toBe(10);
    });

    it('should return 0 for null dates', () => {
      const date = new Date('2024-01-01');
      expect(daysDifference(null, date)).toBe(0);
      expect(daysDifference(date, null)).toBe(0);
      expect(daysDifference(null, null)).toBe(0);
    });

    it('should return 0 for same date', () => {
      const date = new Date('2024-01-01');
      expect(daysDifference(date, date)).toBe(0);
    });
  });

  describe('formatISO', () => {
    it('should format date to ISO string', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      expect(formatISO(date)).toBe('2024-01-15T10:30:00.000Z');
    });

    it('should return empty string for null', () => {
      expect(formatISO(null)).toBe('');
    });
  });

  describe('formatHuman', () => {
    it('should format date to human readable string', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const formatted = formatHuman(date);
      expect(formatted).toContain('Jan');
      expect(formatted).toContain('15');
      expect(formatted).toContain('2024');
    });

    it('should return "Unknown" for null', () => {
      expect(formatHuman(null)).toBe('Unknown');
    });
  });

  describe('minDate', () => {
    it('should return minimum date from array', () => {
      const dates = [
        new Date('2024-01-15'),
        new Date('2024-01-10'),
        new Date('2024-01-20'),
      ];
      const min = minDate(dates);
      expect(min?.toISOString()).toBe(new Date('2024-01-10').toISOString());
    });

    it('should handle null values in array', () => {
      const dates = [
        new Date('2024-01-15'),
        null,
        new Date('2024-01-10'),
      ];
      const min = minDate(dates);
      expect(min?.toISOString()).toBe(new Date('2024-01-10').toISOString());
    });

    it('should return null for empty array', () => {
      expect(minDate([])).toBeNull();
    });

    it('should return null for array of nulls', () => {
      expect(minDate([null, null])).toBeNull();
    });
  });

  describe('maxDate', () => {
    it('should return maximum date from array', () => {
      const dates = [
        new Date('2024-01-15'),
        new Date('2024-01-10'),
        new Date('2024-01-20'),
      ];
      const max = maxDate(dates);
      expect(max?.toISOString()).toBe(new Date('2024-01-20').toISOString());
    });

    it('should handle null values in array', () => {
      const dates = [
        new Date('2024-01-15'),
        null,
        new Date('2024-01-20'),
      ];
      const max = maxDate(dates);
      expect(max?.toISOString()).toBe(new Date('2024-01-20').toISOString());
    });

    it('should return null for empty array', () => {
      expect(maxDate([])).toBeNull();
    });
  });

  describe('isValidDate', () => {
    it('should return true for valid dates', () => {
      expect(isValidDate(new Date('2024-01-15'))).toBe(true);
      expect(isValidDate(new Date())).toBe(true);
    });

    it('should return false for invalid dates', () => {
      expect(isValidDate(new Date('invalid'))).toBe(false);
      expect(isValidDate(null)).toBe(false);
      expect(isValidDate(undefined)).toBe(false);
      expect(isValidDate('2024-01-15')).toBe(false);
      expect(isValidDate({})).toBe(false);
    });
  });
});
