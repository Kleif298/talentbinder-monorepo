import { describe, it, expect } from 'vitest';
import { candidatesAPI } from './candidatesAPI';

describe('candidatesAPI', () => {
  describe('getAll', () => {
    it('has getAll method defined', () => {
      expect(candidatesAPI.getAll).toBeDefined();
      expect(typeof candidatesAPI.getAll).toBe('function');
    });
  });

  describe('create', () => {
    it('has create method defined', () => {
      expect(candidatesAPI.create).toBeDefined();
      expect(typeof candidatesAPI.create).toBe('function');
    });
  });

  describe('update', () => {
    it('has update method defined', () => {
      expect(candidatesAPI.update).toBeDefined();
      expect(typeof candidatesAPI.update).toBe('function');
    });
  });

  describe('delete', () => {
    it('has delete method defined', () => {
      expect(candidatesAPI.delete).toBeDefined();
      expect(typeof candidatesAPI.delete).toBe('function');
    });
  });
});
