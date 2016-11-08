// @flow

export interface AtomGetter<V> {
    get(): V;
}

export interface Atom<V> extends AtomGetter<V> {
    set(val: V): void;
}

export interface Computed<V> extends AtomGetter<V> {
    subscribe(fn: (v: V) => void, err?: (e: Error) => void): () => void;
}

export type Fn<V: Object | Function> = (...args: any) => V

export type Transact = (fn: () => void) => void

export type CreateInstance<V> = (proto: Function, args: mixed[]) => V

export interface IAtomError {
    error: Error;
}

export interface IInstanceFactory<V> extends AtomGetter<V> {
    setAtom(atom: Computed<V>): IInstanceFactory<V>;
    setSafeMode(isSafe: boolean): IInstanceFactory<V>;
    createListener(
        fn: (v: V) => void,
        err?: (e: Error) => void
    ): (v: V) => void;
}

export interface AtmoverPlugin {
    createInstanceAtom<V: Object | Function>(
        instanceFactory: IInstanceFactory<V>
    ): Computed<V>;
    createValueAtom<V: Object | Function>(value: V): Atom<V>;
    transact: Transact;
}

export interface ProtoCache<V> {
    set(key: V, value: V): void;
    get(key: V): Atom<V>;
}

type ValuesRec = {key: string, value: AtomGetter<*>}

export type NormalizedAtomArg = {
    id: 1;
    value: AtomGetter<*>;
} | {
    id: 2;
    values: ValuesRec[]
}

export type NormalizedAtomArgs = {
    id: 3;
    args: NormalizedAtomArg[];
}

export type AtomArg = AtomGetter<*> | {[id: string]: AtomGetter<*>}

export const metaKey = Symbol('ao:atom')
export const onUpdate = Symbol('ao:upd')
