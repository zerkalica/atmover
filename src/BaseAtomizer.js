// @flow

import type {Transact, Atom, Atomizer, Fn, AtomizerPlugin, ProtoCache, BaseAtom} from './interfaces'
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
    _plugin: AtomizerPlugin

    constructor(plugin: AtomizerPlugin) {
        this._plugin = plugin
    }

    get(key: V): BaseAtom<V> {
        const protos = this._protos
        let atom: ?BaseAtom<V> = protos.get(key)
        if (!atom) {
            atom = this._plugin.createValueAtom(key)
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
    _plugin: AtomizerPlugin
    _protoCache: ProtoCache<Function>

    transact: Transact

    constructor(
        plugin: AtomizerPlugin,
        isHotReplace?: boolean
    ) {
        this._plugin = plugin
        this.transact = plugin.transact
        this._protoCache = isHotReplace
            ? new MapProtoCache(plugin)
            : new FakeProtoCache()
    }

    value<V: Object>(v: V): Atom<V> {
        return this._plugin.createValueAtom(v)
    }

    replaceProto(from: Function, to: Function): void {
        this._protoCache.set(from, to)
    }

    construct<V: Object>(p: Class<V>, args?: mixed[]): Atom<V> {
        return this._plugin.createInstanceAtom(
            fastCreateObject,
            this._protoCache.get(p),
            args ? this.value(args) : new ArgsBaseAtom()
        )
    }

    factory<V: Object>(p: Fn<V>, args?: mixed[]): Atom<V> {
        return this._plugin.createInstanceAtom(
            fastCall,
            this._protoCache.get(p),
            args ? this.value(args) : new ArgsBaseAtom(),
        )
    }

    constructComputed<V: Object>(p: Class<V>, args?: BaseAtom<*>[]): Atom<V> {
        return this._plugin.createInstanceAtom(
            fastCreateObject,
            this._protoCache.get(p),
            new ArgsBaseAtom(args)
        )
    }

    factoryComputed<V: Object>(p: Fn<V>, args?: BaseAtom<*>[]): Atom<V> {
        return this._plugin.createInstanceAtom(
            fastCall,
            this._protoCache.get(p),
            new ArgsBaseAtom(args)
        )
    }
}
if (0) ((new BaseAtomizer(...(0: any))): Atomizer) // eslint-disable-line
