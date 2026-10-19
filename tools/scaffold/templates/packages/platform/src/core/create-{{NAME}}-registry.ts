/** A keyed collection of values, resolved by name. Replace with the package's real capability. */
export interface {{PASCAL}}Registry<T> {
  register(key: string, value: T): void;
  resolve(key: string): T;
  has(key: string): boolean;
}

/**
 * Create an empty registry. Registering a key twice throws rather than silently shadowing the first entry.
 *
 * @example
 * const registry = create{{PASCAL}}Registry<number>();
 * registry.register("answer", 42);
 * registry.resolve("answer"); // 42
 */
export function create{{PASCAL}}Registry<T>(): {{PASCAL}}Registry<T> {
  const values = new Map<string, T>();
  return {
    register(key, value) {
      if (values.has(key)) throw new Error(`{{NAME}}: already registered: ${key}`);
      values.set(key, value);
    },
    resolve(key) {
      if (!values.has(key)) throw new Error(`{{NAME}}: not registered: ${key}`);
      return values.get(key) as T;
    },
    has: (key) => values.has(key),
  };
}
