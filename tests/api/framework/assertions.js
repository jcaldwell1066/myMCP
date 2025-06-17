/**
 * Custom Assertions for myMCP Engine Testing
 * Provides domain-specific assertion helpers
 */

class AssertionError extends Error {
  constructor(message, actual, expected) {
    super(message);
    this.name = 'AssertionError';
    this.actual = actual;
    this.expected = expected;
  }
}

class Expect {
  constructor(actual) {
    this.actual = actual;
    this.negated = false;
  }

  get not() {
    this.negated = !this.negated;
    return this;
  }

  // Basic assertions
  toBe(expected) {
    const passed = this.actual === expected;
    if (this.negated ? passed : !passed) {
      throw new AssertionError(
        `Expected ${JSON.stringify(this.actual)} ${this.negated ? 'not ' : ''}to be ${JSON.stringify(expected)}`,
        this.actual,
        expected
      );
    }
    return this;
  }

  toEqual(expected) {
    const passed = JSON.stringify(this.actual) === JSON.stringify(expected);
    if (this.negated ? passed : !passed) {
      throw new AssertionError(
        `Expected ${JSON.stringify(this.actual)} ${this.negated ? 'not ' : ''}to equal ${JSON.stringify(expected)}`,
        this.actual,
        expected
      );
    }
    return this;
  }

  toContain(expected) {
    const passed = Array.isArray(this.actual) 
      ? this.actual.includes(expected)
      : String(this.actual).includes(String(expected));
    
    if (this.negated ? passed : !passed) {
      throw new AssertionError(
        `Expected ${JSON.stringify(this.actual)} ${this.negated ? 'not ' : ''}to contain ${JSON.stringify(expected)}`,
        this.actual,
        expected
      );
    }
    return this;
  }

  toBeGreaterThan(expected) {
    const passed = this.actual > expected;
    if (this.negated ? passed : !passed) {
      throw new AssertionError(
        `Expected ${this.actual} ${this.negated ? 'not ' : ''}to be greater than ${expected}`,
        this.actual,
        expected
      );
    }
    return this;
  }

  toBeLessThan(expected) {
    const passed = this.actual < expected;
    if (this.negated ? passed : !passed) {
      throw new AssertionError(
        `Expected ${this.actual} ${this.negated ? 'not ' : ''}to be less than ${expected}`,
        this.actual,
        expected
      );
    }
    return this;
  }

  toHaveLength(expected) {
    const actual = this.actual?.length;
    const passed = actual === expected;
    if (this.negated ? passed : !passed) {
      throw new AssertionError(
        `Expected length ${actual} ${this.negated ? 'not ' : ''}to be ${expected}`,
        actual,
        expected
      );
    }
    return this;
  }

  toBeNull() {
    const passed = this.actual === null;
    if (this.negated ? passed : !passed) {
      throw new AssertionError(
        `Expected ${JSON.stringify(this.actual)} ${this.negated ? 'not ' : ''}to be null`,
        this.actual,
        null
      );
    }
    return this;
  }

  toBeUndefined() {
    const passed = this.actual === undefined;
    if (this.negated ? passed : !passed) {
      throw new AssertionError(
        `Expected ${JSON.stringify(this.actual)} ${this.negated ? 'not ' : ''}to be undefined`,
        this.actual,
        undefined
      );
    }
    return this;
  }

  toBeTruthy() {
    const passed = Boolean(this.actual);
    if (this.negated ? passed : !passed) {
      throw new AssertionError(
        `Expected ${JSON.stringify(this.actual)} ${this.negated ? 'not ' : ''}to be truthy`,
        this.actual,
        true
      );
    }
    return this;
  }

  toBeFalsy() {
    const passed = !Boolean(this.actual);
    if (this.negated ? passed : !passed) {
      throw new AssertionError(
        `Expected ${JSON.stringify(this.actual)} ${this.negated ? 'not ' : ''}to be falsy`,
        this.actual,
        false
      );
    }
    return this;
  }

  // HTTP Response assertions
  toHaveStatus(expectedStatus) {
    const status = this.actual?.statusCode || this.actual?.status;
    const passed = status === expectedStatus;
    if (this.negated ? passed : !passed) {
      throw new AssertionError(
        `Expected HTTP status ${status} ${this.negated ? 'not ' : ''}to be ${expectedStatus}`,
        status,
        expectedStatus
      );
    }
    return this;
  }

  toBeSuccessful() {
    const status = this.actual?.statusCode || this.actual?.status;
    const passed = status >= 200 && status < 300;
    if (this.negated ? passed : !passed) {
      throw new AssertionError(
        `Expected HTTP status ${status} ${this.negated ? 'not ' : ''}to be successful (2xx)`,
        status,
        '2xx'
      );
    }
    return this;
  }

  toHaveProperty(propertyPath, expectedValue = undefined) {
    const keys = propertyPath.split('.');
    let current = this.actual;
    
    for (const key of keys) {
      if (current === null || current === undefined || !(key in current)) {
        if (!this.negated) {
          throw new AssertionError(
            `Expected object to have property '${propertyPath}'`,
            this.actual,
            `object with property '${propertyPath}'`
          );
        }
        return this;
      }
      current = current[key];
    }
    
    if (this.negated) {
      throw new AssertionError(
        `Expected object not to have property '${propertyPath}'`,
        this.actual,
        `object without property '${propertyPath}'`
      );
    }
    
    if (expectedValue !== undefined && current !== expectedValue) {
      throw new AssertionError(
        `Expected property '${propertyPath}' to be ${JSON.stringify(expectedValue)}, but got ${JSON.stringify(current)}`,
        current,
        expectedValue
      );
    }
    
    return this;
  }

  // Game-specific assertions
  toBeValidGameState() {
    const required = ['player', 'quests', 'inventory', 'session', 'metadata'];
    const missing = required.filter(field => !this.actual?.[field]);
    
    if (missing.length > 0) {
      throw new AssertionError(
        `Expected valid game state, but missing fields: ${missing.join(', ')}`,
        this.actual,
        'valid game state'
      );
    }
    return this;
  }

  toBeValidPlayer() {
    const required = ['id', 'name', 'score', 'level', 'status', 'location'];
    const missing = required.filter(field => this.actual?.[field] === undefined);
    
    if (missing.length > 0) {
      throw new AssertionError(
        `Expected valid player, but missing fields: ${missing.join(', ')}`,
        this.actual,
        'valid player'
      );
    }
    return this;
  }

  toBeValidQuest() {
    const required = ['id', 'title', 'description', 'status', 'steps', 'reward'];
    const missing = required.filter(field => !this.actual?.[field]);
    
    if (missing.length > 0) {
      throw new AssertionError(
        `Expected valid quest, but missing fields: ${missing.join(', ')}`,
        this.actual,
        'valid quest'
      );
    }
    return this;
  }

  toHaveQuestStatus(expectedStatus) {
    const status = this.actual?.status;
    const passed = status === expectedStatus;
    if (this.negated ? passed : !passed) {
      throw new AssertionError(
        `Expected quest status '${status}' ${this.negated ? 'not ' : ''}to be '${expectedStatus}'`,
        status,
        expectedStatus
      );
    }
    return this;
  }

  toHavePlayerLevel(expectedLevel) {
    const level = this.actual?.level;
    const passed = level === expectedLevel;
    if (this.negated ? passed : !passed) {
      throw new AssertionError(
        `Expected player level '${level}' ${this.negated ? 'not ' : ''}to be '${expectedLevel}'`,
        level,
        expectedLevel
      );
    }
    return this;
  }
}

function expect(actual) {
  return new Expect(actual);
}

// Utility assertion functions
function assertTrue(condition, message = 'Expected condition to be true') {
  if (!condition) {
    throw new AssertionError(message, condition, true);
  }
}

function assertFalse(condition, message = 'Expected condition to be false') {
  if (condition) {
    throw new AssertionError(message, condition, false);
  }
}

function fail(message = 'Test failed') {
  throw new AssertionError(message);
}

module.exports = {
  expect,
  assertTrue,
  assertFalse,
  fail,
  AssertionError
};
