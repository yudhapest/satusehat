/**
 * Minimal Jest-style `expect` built on `node:assert`, so the suite runs on the
 * built-in `node:test` runner without a third-party test framework.
 *
 * Only the matchers used by this suite are implemented. Semantics follow Jest:
 * - `toEqual` ignores object properties whose value is `undefined`.
 * - `toMatchObject` checks that `expected` is a recursive subset of `actual`.
 * - `toThrow(string)` checks that the error message contains the string.
 */
import assert from "node:assert/strict";

type Constructor = abstract new (...args: never[]) => unknown;
type ThrowExpectation = Constructor | string | RegExp;

export interface Matchers {
  toBe(expected: unknown): void;
  toEqual(expected: unknown): void;
  toMatchObject(expected: object): void;
  toContain(expected: unknown): void;
  toHaveLength(expected: number): void;
  toBeDefined(): void;
  toBeUndefined(): void;
  toBeGreaterThan(expected: number): void;
  toBeInstanceOf(expected: Constructor): void;
  toThrow(expected?: ThrowExpectation): void;
}

export type AsyncMatchers = {
  [Key in keyof Matchers]: (...args: Parameters<Matchers[Key]>) => Promise<void>;
};

export interface Expectation extends Matchers {
  not: Matchers;
  rejects: AsyncMatchers;
  resolves: AsyncMatchers;
}

const matcherNames = [
  "toBe",
  "toEqual",
  "toMatchObject",
  "toContain",
  "toHaveLength",
  "toBeDefined",
  "toBeUndefined",
  "toBeGreaterThan",
  "toBeInstanceOf",
  "toThrow",
] as const satisfies ReadonlyArray<keyof Matchers>;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    value !== null && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype
  );
}

function stripUndefined(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stripUndefined);
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, item]) => item !== undefined)
        .map(([key, item]) => [key, stripUndefined(item)]),
    );
  }

  return value;
}

function isSubset(actual: unknown, expected: unknown): boolean {
  if (expected === null || typeof expected !== "object") {
    return Object.is(actual, expected);
  }

  if (actual === null || typeof actual !== "object") {
    return false;
  }

  if (Array.isArray(expected)) {
    return (
      Array.isArray(actual) &&
      actual.length === expected.length &&
      expected.every((item, index) => isSubset(actual[index], item))
    );
  }

  return Object.entries(expected).every(([key, item]) =>
    isSubset((actual as Record<string, unknown>)[key], item),
  );
}

function format(value: unknown): string {
  return typeof value === "function"
    ? `[Function ${value.name || "anonymous"}]`
    : JSON.stringify(value);
}

function assertThrownMatches(error: unknown, expected: ThrowExpectation | undefined): void {
  if (expected === undefined) {
    return;
  }

  if (typeof expected === "function") {
    assert.ok(
      error instanceof expected,
      `Expected error to be an instance of ${expected.name}, received ${String(error)}`,
    );
    return;
  }

  const message = error instanceof Error ? error.message : String(error);

  if (typeof expected === "string") {
    assert.ok(
      message.includes(expected),
      `Expected error message to contain ${format(expected)}, received ${format(message)}`,
    );
    return;
  }

  assert.match(message, expected);
}

function createMatchers(actual: unknown, negated: boolean): Matchers {
  const check = (pass: boolean, message: string): void => {
    assert.ok(negated ? !pass : pass, negated ? `Expected not: ${message}` : message);
  };

  return {
    toBe(expected) {
      if (negated) {
        assert.notStrictEqual(actual, expected);
      } else {
        assert.strictEqual(actual, expected);
      }
    },
    toEqual(expected) {
      if (negated) {
        assert.notDeepStrictEqual(stripUndefined(actual), stripUndefined(expected));
      } else {
        assert.deepStrictEqual(stripUndefined(actual), stripUndefined(expected));
      }
    },
    toMatchObject(expected) {
      check(
        isSubset(actual, expected),
        `Expected ${format(actual)} to match object ${format(expected)}`,
      );
    },
    toContain(expected) {
      const pass =
        typeof actual === "string"
          ? typeof expected === "string" && actual.includes(expected)
          : Array.isArray(actual) && actual.includes(expected);

      check(pass, `Expected ${format(actual)} to contain ${format(expected)}`);
    },
    toHaveLength(expected) {
      const length = (actual as { length?: unknown } | null | undefined)?.length;
      check(length === expected, `Expected length ${expected}, received ${String(length)}`);
    },
    toBeDefined() {
      check(actual !== undefined, "Expected value to be defined");
    },
    toBeUndefined() {
      check(actual === undefined, `Expected undefined, received ${format(actual)}`);
    },
    toBeGreaterThan(expected) {
      check(
        typeof actual === "number" && actual > expected,
        `Expected ${String(actual)} to be greater than ${expected}`,
      );
    },
    toBeInstanceOf(expected) {
      check(
        actual instanceof expected,
        `Expected ${format(actual)} to be an instance of ${expected.name}`,
      );
    },
    toThrow(expected) {
      assert.equal(typeof actual, "function", "toThrow() expects a function");

      let thrown = false;
      let error: unknown;

      try {
        (actual as () => unknown)();
      } catch (caught) {
        thrown = true;
        error = caught;
      }

      if (negated) {
        assert.ok(!thrown, `Expected function not to throw, but it threw ${String(error)}`);
        return;
      }

      assert.ok(thrown, "Expected function to throw");
      assertThrownMatches(error, expected);
    },
  };
}

function createAsyncMatchers(settle: () => Promise<unknown>): AsyncMatchers {
  const asyncMatchers = {} as Record<keyof Matchers, (...args: unknown[]) => Promise<void>>;

  for (const name of matcherNames) {
    asyncMatchers[name] = async (...args) => {
      const matcher = createMatchers(await settle(), false)[name] as (...a: unknown[]) => void;
      matcher(...args);
    };
  }

  return asyncMatchers as AsyncMatchers;
}

export function expect(actual: unknown): Expectation {
  return {
    ...createMatchers(actual, false),
    not: createMatchers(actual, true),
    rejects: createAsyncMatchers(async () => {
      try {
        await actual;
      } catch (error) {
        return error;
      }

      return assert.fail("Expected promise to reject, but it resolved");
    }),
    resolves: createAsyncMatchers(async () => await actual),
  };
}
