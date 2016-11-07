// @flow

export interface AtomGetter<V> {
    get(): V;
}

export interface AtomSetter<V> extends AtomGetter<V> {
    set(val: V): void;
}

export interface Atom<V> extends AtomSetter<V> {
    subscribe(fn: (v: V) => void): () => void;
}

export type Fn<V: Object | Function> = (...args: any) => V

export type Transact = (fn: () => void) => void

export type CreateInstance<V> = (proto: Function, args: mixed[]) => V

export interface AtmoverPlugin {
    createInstanceAtom<V: Object | Function>(
        create: CreateInstance<V>,
        protoAtom: AtomGetter<Function>,
        args: AtomGetter<*>[]
    ): Atom<V>;
    createValueAtom<V: Object | Function>(value: V): Atom<V>;
    transact: Transact;
}

export interface ProtoCache<V> {
    set(key: V, value: V): void;
    get(key: V): AtomSetter<V>;
}

export const metaKey = Symbol('aovr:atom')
export const onUpdate = Symbol('aovr:onUpdate')
