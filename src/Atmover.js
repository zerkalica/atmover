// @flow

import type {Transact, Atom, Fn, AtmoverPlugin, ProtoCache, AtomGetter, AtomSetter} from './interfaces'
import {fastCreateObject, fastCall} from './fastCreate'

class FakeAtomSetter<V> {
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
    get(f: V): AtomSetter<V> {
        return new FakeAtomSetter(f)
    }

    set(_key: V, _val: V): void {
        throw new Error('Can\'t set non-atom values')
    }
}

class MappedProtoCache<V: Function> {
    _protos: Map<V, AtomSetter<V>> = new Map()
    _plugin: AtmoverPlugin

    constructor(plugin: AtmoverPlugin) {
        this._plugin = plugin
    }

    get(key: V): AtomSetter<V> {
        const protos = this._protos
        let atom: ?AtomSetter<V> = protos.get(key)
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

export default class Atmover {
    _plugin: AtmoverPlugin
    _protoCache: ProtoCache<Function>

    transact: Transact

    constructor(
        plugin: AtmoverPlugin,
        isHotReplace?: boolean
    ) {
        this._plugin = plugin
        this.transact = plugin.transact
        this._protoCache = isHotReplace
            ? new MappedProtoCache(plugin)
            : new FakeProtoCache()
    }

    value<V: Object>(v: V): Atom<V> {
        return this._plugin.createValueAtom(v)
    }

    replaceProto<V: Object | Function>(from: Class<V> | Fn<V>, to: Class<V> | Fn<V>): void {
        this._protoCache.set(from, to)
    }

    construct<V: Object>(p: Class<V>, args?: AtomGetter<*>[]): Atom<V> {
        return this._plugin.createInstanceAtom(
            fastCreateObject,
            this._protoCache.get(p),
            args || []
        )
    }

    factory<V: Object>(p: Fn<V>, args?: AtomGetter<*>[]): Atom<V> {
        return this._plugin.createInstanceAtom(
            fastCall,
            this._protoCache.get(p),
            args || []
        )
    }
}