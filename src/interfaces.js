// @flow

export interface BaseGet<V> {
    get(): V;
}

export interface BaseAtom<V> extends BaseGet<V> {
    set(val: V): void;
}

export interface Atom<V> extends BaseAtom<V> {
    setArgs(val: mixed[]): void;
    subscribe(fn: (v: V) => void): () => void;
}

export type Fn<V: Object> = (...args: any) => V

export type Transact = (fn: () => void) => void

export type CreateValueAtom<V> = (v: V) => Atom<V>

export type CreateInstance<V> = (proto: Function, args: mixed[]) => V

export type CreateProtoAtom<V> = (
    create: CreateInstance<V>,
    protoAtom: BaseGet<Function>,
    argsAtom: BaseAtom<mixed[]>
) => Atom<V>

export interface Atomizer {
    transact: Transact;
    value: CreateValueAtom<*>;

    replaceProto(from: Function, to: Function): void;

    construct<V: Object>(p: Class<V>, args?: mixed[]): Atom<V>;
    factory<V: Object>(p: Fn<V>, args?: mixed[]): Atom<V>;

    constructComputed<V: Object>(p: Class<V>, args?: BaseAtom<*>[]): Atom<V>;
    factoryComputed<V: Object>(p: Fn<V>, args?: BaseAtom<*>[]): Atom<V>;
}

export interface ProtoCache<V> {
    set(key: V, value: V): void;
    get(key: V): BaseAtom<V>;
}

export const metaKey = Symbol('rdi:atom')
export const onUpdate = Symbol('rdi:onUpdate')