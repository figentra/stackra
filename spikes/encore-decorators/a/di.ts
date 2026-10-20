/** Minimal Nest-shaped container: legacy decorators, explicit tokens, no reflect-metadata. */
export type Token<T = unknown> = string | symbol | (abstract new (...a: never[]) => T);
const injections = new WeakMap<object, Map<number, Token>>();
const injectables = new WeakSet<object>();
const moduleMeta = new WeakMap<object, { providers: Token[]; controllers: object[] }>();
const routes = new WeakMap<object, { method: string; path: string; key: string | symbol }[]>();
const base = (p: string) => p;

export const Injectable = (): ClassDecorator => (t) => void injectables.add(t);
export const Inject = (token: Token): ParameterDecorator => (target, _k, index) => {
  const m = injections.get(target) ?? new Map();
  m.set(index, token);
  injections.set(target, m);
};
export const Module = (meta: { providers?: Token[]; controllers?: object[] }): ClassDecorator => (t) =>
  void moduleMeta.set(t, { providers: meta.providers ?? [], controllers: meta.controllers ?? [] });
export const Controller = (prefix = ""): ClassDecorator => (t) => { routes.set(t, routes.get(t) ?? []); void base(prefix); };
export const Get = (path: string): MethodDecorator => (target, key) => {
  const list = routes.get(target.constructor) ?? [];
  list.push({ method: "GET", path, key });
  routes.set(target.constructor, list);
};
export const routesOf = (c: object) => routes.get(c) ?? [];

export class Container {
  private instances = new Map<Token, unknown>();
  constructor(private providers: Map<Token, new (...a: never[]) => unknown>) {}
  static from(mod: object): Container {
    const meta = moduleMeta.get(mod);
    if (!meta) throw new Error("not a @Module");
    return new Container(new Map(meta.providers.map((p) => [p, p as never])));
  }
  get<T>(token: Token<T>): T {
    if (this.instances.has(token)) return this.instances.get(token) as T;
    const Cls = this.providers.get(token);
    if (!Cls) throw new Error(`no provider for ${String(token)}`);
    const deps = injections.get(Cls) ?? new Map();
    const args = [...deps.entries()].sort((a, b) => a[0] - b[0]).map(([, t]) => this.get(t));
    const inst = new (Cls as new (...a: unknown[]) => T)(...args);
    this.instances.set(token, inst);
    return inst;
  }
}
