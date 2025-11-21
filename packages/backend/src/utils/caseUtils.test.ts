/**
 * Unit Tests for Case Conversion Utilities
 */

import { snakeToCamelObj, snakeToCamelArray } from './caseUtils.js';

describe('Case Conversion Utils', () => {
    describe('snakeToCamelObj', () => {
        it('should convert snake_case keys to camelCase', () => {
            const input = {
                first_name: 'John',
                last_name: 'Doe',
                email_address: 'john@example.com',
                user_id: 123
            };

            const result = snakeToCamelObj(input);

            expect(result).toEqual({
                firstName: 'John',
                lastName: 'Doe',
                emailAddress: 'john@example.com',
                userId: 123
            });
        });

        it('should handle keys without underscores', () => {
            const input = {
                name: 'John',
                email: 'john@example.com',
                id: 1
            };

            const result = snakeToCamelObj(input);

            expect(result).toEqual({
                name: 'John',
                email: 'john@example.com',
                id: 1
            });
        });

        it('should handle empty objects', () => {
            const result = snakeToCamelObj({});
            expect(result).toEqual({});
        });

        it('should preserve null and undefined values', () => {
            const input = {
                first_name: null,
                last_name: undefined,
                age: 0
            };

            const result = snakeToCamelObj(input);

            expect(result).toEqual({
                firstName: null,
                lastName: undefined,
                age: 0
            });
        });

        it('should handle nested objects (shallow conversion)', () => {
            const input = {
                user_info: { first_name: 'John' },
                user_id: 1
            };

            const result = snakeToCamelObj(input);

            expect(result).toEqual({
                userInfo: { first_name: 'John' }, // Nested object not converted
                userId: 1
            });
        });
    });

    describe('snakeToCamelArray', () => {
        it('should convert array of objects from snake_case to camelCase', () => {
            const input = [
                { first_name: 'John', last_name: 'Doe', user_id: 1 },
                { first_name: 'Jane', last_name: 'Smith', user_id: 2 }
            ];

            const result = snakeToCamelArray(input);

            expect(result).toEqual([
                { firstName: 'John', lastName: 'Doe', userId: 1 },
                { firstName: 'Jane', lastName: 'Smith', userId: 2 }
            ]);
        });

        it('should handle empty arrays', () => {
            const result = snakeToCamelArray([]);
            expect(result).toEqual([]);
        });

        it('should handle arrays with mixed data', () => {
            const input = [
                { simple_key: 'value1' },
                { another_key: 'value2', third_key: 123 }
            ];

            const result = snakeToCamelArray(input);

            expect(result).toEqual([
                { simpleKey: 'value1' },
                { anotherKey: 'value2', thirdKey: 123 }
            ]);
        });
    });
});
