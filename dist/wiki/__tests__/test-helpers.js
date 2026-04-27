import assert from 'node:assert/strict';
const ARRAY_CONTAINING = Symbol('arrayContaining');
function normalize(value) {
    return value;
}
function matchesArrayContaining(actual, expected) {
    if (!Array.isArray(actual))
        return false;
    return expected.expected.every((item) => actual.some((candidate) => {
        try {
            assert.deepEqual(candidate, item);
            return true;
        }
        catch {
            return false;
        }
    }));
}
export function expect(actual) {
    const actualString = typeof actual === 'string' ? actual : String(actual);
    const actualArray = actual;
    return {
        toBe(expected) {
            assert.equal(actual, expected);
        },
        toEqual(expected) {
            if (expected && typeof expected === 'object' && expected.__matcher === ARRAY_CONTAINING) {
                assert.ok(matchesArrayContaining(actual, expected));
                return;
            }
            assert.deepEqual(actual, expected);
        },
        toContain(expected) {
            if (typeof actual === 'string') {
                assert.ok(actual.includes(String(expected)));
                return;
            }
            assert.ok(Array.isArray(actualArray));
            assert.ok(actualArray.includes(expected));
        },
        toBeNull() {
            assert.equal(actual, null);
        },
        toHaveLength(expected) {
            assert.equal(actual?.length, expected);
        },
        toBeGreaterThan(expected) {
            assert.ok(typeof actual === 'number' && actual > expected);
        },
        toBeGreaterThanOrEqual(expected) {
            assert.ok(typeof actual === 'number' && actual >= expected);
        },
        toBeLessThanOrEqual(expected) {
            assert.ok(typeof actual === 'number' && actual <= expected);
        },
        toBeDefined() {
            assert.notEqual(actual, undefined);
        },
        toBeUndefined() {
            assert.equal(actual, undefined);
        },
        toHaveProperty(property) {
            assert.ok(actual !== null && typeof actual === 'object' && property in actual);
        },
        toMatch(pattern) {
            assert.match(actualString, pattern);
        },
        toThrow(expected) {
            assert.equal(typeof actual, 'function');
            if (expected === undefined) {
                assert.throws(actual);
            }
            else if (typeof expected === 'string') {
                assert.throws(actual, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
            }
            else {
                assert.throws(actual, expected);
            }
        },
        get not() {
            return {
                toBeNull() {
                    assert.notEqual(actual, null);
                },
                toBe(expected) {
                    assert.notEqual(actual, expected);
                },
                toContain(expected) {
                    if (typeof actual === 'string') {
                        assert.ok(!actual.includes(String(expected)));
                        return;
                    }
                    assert.ok(Array.isArray(actualArray));
                    assert.ok(!actualArray.includes(expected));
                },
                toThrow() {
                    assert.equal(typeof actual, 'function');
                    assert.doesNotThrow(actual);
                },
            };
        },
    };
}
expect.arrayContaining = (expected) => ({
    __matcher: ARRAY_CONTAINING,
    expected: expected.map(normalize),
});
//# sourceMappingURL=test-helpers.js.map