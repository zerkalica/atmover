// @flow

export interface BaseAtom<V> {
    set(val: V): void;
    get(): V;
}

export interface Atom<V> extends BaseAtom<V> {
    setArgs(val: mixed[]): void;
    setProto(p: Class<V>): void;
    subscribe(fn: (v: V) => void): () => void;
}

export type Fn<V: Object> = (...args: any) => V

export interface Atomizer {
    transact: (fn: () => void) => void;

    value<V: Object | Function>(v: V): Atom<V>;
    construct<V: Object>(p: Class<V>, args?: mixed[]): Atom<V>;
    factory<V: Object>(p: Fn<V>, args?: mixed[]): Atom<V>;

    constructComputed<V: Object>(p: Class<V>, args?: Atom<*>[]): Atom<V>;
    factoryComputed<V: Object>(p: Fn<V>, args?: Atom<*>[]): Atom<V>;
}

export const metaKey = Symbol('rdi:atom')
export const onUpdate = Symbol('rdi:onUpdate')
