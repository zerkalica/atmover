// @flow

import type {Transact, Atom, Fn, AtomixerPlugin, ProtoCache, AtomGetter, AtomSetter} from './interfaces'
import {fastCreateObject, fastCall} from './fastCreate'
import getAtom from './getAtom'

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
    _plugin: AtomixerPlugin

    constructor(plugin: AtomixerPlugin) {
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

export default class AtomSetterixer {
    _plugin: AtomixerPlugin
    _protoCache: ProtoCache<Function>

    transact: Transact

    constructor(
        plugin: AtomixerPlugin,
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

    replaceProto(from: Function, to: Function): void {
        this._protoCache.set(from, to)
    }

    _getAtom(rawArgs?: (Object | Function)[]): AtomGetter<*>[] {
        const result: AtomGetter<*>[] = []
        const args = rawArgs || []
        for (let i = 0, l = args.length; i < l; i++) {
            result.push(getAtom(args[i]))
        }

        return result
    }

    construct<V: Object>(p: Class<V>, args?: AtomGetter<*>[]): Atom<V> {
        return this._plugin.createInstanceAtom(
            fastCreateObject,
            this._protoCache.get(p),
            this._getAtom(args)
        )
    }

    factory<V: Object>(p: Fn<V>, args?: AtomGetter<*>[]): Atom<V> {
        return this._plugin.createInstanceAtom(
            fastCall,
            this._protoCache.get(p),
            this._getAtom(args)
        )
    }
}
