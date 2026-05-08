// Polyfill pour Node.js 22+ où localStorage existe mais getItem n'est pas une fonction
// NextAuth v4 teste "typeof localStorage !== 'undefined'" puis appelle getItem() ce qui plante en SSR

const g = globalThis as Record<string, unknown>;

if (g.localStorage && typeof (g.localStorage as Storage).getItem !== "function") {
  const map = new Map<string, string>();
  const store: Storage = {
    getItem: (key) => map.get(String(key)) ?? null,
    setItem: (key, value) => map.set(String(key), String(value)),
    removeItem: (key) => map.delete(String(key)),
    clear: () => map.clear(),
    key: (index) => Array.from(map.keys())[index] ?? null,
    get length() {
      return map.size;
    },
  } as unknown as Storage;

  Object.defineProperty(g, "localStorage", {
    value: store,
    writable: true,
    configurable: true,
  });
}
