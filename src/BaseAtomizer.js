// @flow

import type {Transact, Atom, Atomizer, Fn, CreateProtoAtom, CreateValueAtom, ProtoCache, BaseAtom} from './interfaces'
import {fastCreateObject, fastCall} from './fastCreate'

class ArgsBaseAtom {
    _args: BaseAtom<*>[]

    constructor(args?: ?BaseAtom<*>[]) {
        this._args = args || []
    }

    get(): mixed[] {
        const args = this._args
        const l = args.length
        if (!l) {
            return (args: any)
        }
        const result: mixed[] = new Array(l)
        for (let i = 0; i < l; i++) {
            result[i] = args[i].get()
        }
        return result
    }

    set(): void {
        throw new Error('Can\'t set derivable args')
    }
}

class FakeBaseAtom<V> {
    _v: V
    constructor(v: V) {
        this._v = v
    }
    get(): V {
        return this._v
    }
    set(_v: V): void {
        throw new Error('Can\'t set non-atom values')
    }
}

class FakeProtoCache<V> {
    get(f: V): BaseAtom<V> {
        return new FakeBaseAtom(f)
    }

    set(_key: V, _val: V): void {
        throw new Error('Can\'t set non-atom values')
    }
}

class MapProtoCache<V> {
    _protos: Map<V, BaseAtom<V>> = new Map()
    _atomize: CreateValueAtom<V>

    constructor(atomize: CreateValueAtom<V>) {
        this._atomize = atomize
    }

    get(key: V): BaseAtom<V> {
        const protos = this._protos
        let atom: ?BaseAtom<V> = protos.get(key)
        if (!atom) {
            atom = this._atomize(key)
            protos.set(key, atom)
        }

        return atom
    }

    set(from: V, to: V): void {
        const protoAtom = this.get(from)
        protoAtom.set(to)
        this._protos.delete(from)
        this._protos.set(to, protoAtom)
    }
}

export default class BaseAtomizer {
    _atomizeProto: CreateProtoAtom<any>
    _protoCache: ProtoCache<Function>

    transact: Transact
    value: CreateValueAtom<any>

    constructor(
        atomizeProto: CreateProtoAtom<*>,
        transact: Transact,
        atomize: CreateValueAtom<*>,
        isHotReplace?: boolean
    ) {
        this._atomizeProto = atomizeProto
        this.value = atomize
        this.transact = transact
        this._protoCache = isHotReplace
            ? new MapProtoCache(atomize)
            : new FakeProtoCache()
    }

    replaceProto(from: Function, to: Function): void {
        this._protoCache.set(from, to)
    }

    construct<V: Object>(p: Class<V>, args?: mixed[]): Atom<V> {
        return this._atomizeProto(
            fastCreateObject,
            this._protoCache.get(p),
            args ? this.value(args) : new ArgsBaseAtom()
        )
    }

    factory<V: Object>(p: Fn<V>, args?: mixed[]): Atom<V> {
        return this._atomizeProto(
            fastCall,
            this._protoCache.get(p),
            args ? this.value(args) : new ArgsBaseAtom(),
        )
    }

    constructComputed<V: Object>(p: Class<V>, args?: BaseAtom<*>[]): Atom<V> {
        return this._atomizeProto(
            fastCreateObject,
            this._protoCache.get(p),
            new ArgsBaseAtom(args)
        )
    }

    factoryComputed<V: Object>(p: Fn<V>, args?: BaseAtom<*>[]): Atom<V> {
        return this._atomizeProto(
            fastCall,
            this._protoCache.get(p),
            new ArgsBaseAtom(args)
        )
    }
}
if (0) ((new BaseAtomizer(...(0: any))): Atomizer) // eslint-disable-line
