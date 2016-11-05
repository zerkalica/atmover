// @flow

import type {Atom, Atomizer, CreateInstance, BaseGet, BaseAtom} from '../interfaces'
import {createInstanceFactory, createAttachMeta} from '../pluginHelpers'
import BaseAtomizer from '../BaseAtomizer'

interface MobxAtom<V> {
    get(): V;
    set(v: V): void;
    observe(fn: (v: V) => void): () => void;
}

interface Mobx {
    transaction(fn: () => void): void;
    computed<V>(fn: () => V): V;
    autorun(fn: () => void): () => void;
    observable<V>(v: V): MobxAtom<V>;
}

class BoxedValue<V> {
    v: V
    constructor(v: V) {
        this.v = v
    }
}

class MobxValueAtom<V: Object> {
    _value: MobxAtom<BoxedValue<V>>
    _attachMeta: (value: V) => V
    _autorun: (fn: () => void) => () => void

    constructor(
        mobx: Mobx,
        value: V
    ) {
        this._autorun = mobx.autorun
        this._attachMeta = createAttachMeta(this)
        this._value = mobx.observable(new BoxedValue(this._attachMeta(value)))
    }

    setArgs(_opts: mixed[]): void {
        throw new Error('Can\'t set args, use set instead')
    }

    set(value: V): void {
        this._value.set(new BoxedValue(this._attachMeta(value)))
    }

    get(): V {
        return this._value.get().v
    }

    subscribe(fn: (v: V) => void): () => void {
        const unboxValue = (v: BoxedValue<V>) => fn(v.v)
        return this._value.observe(unboxValue)
    }
}

class MobxInstanceAtom<V: Object> {
    _argsAtom: BaseAtom<mixed[]>
    _value: V
    _autorun: (fn: () => void) => () => void

    constructor(
        mobx: Mobx,
        create: CreateInstance<V>,
        protoAtom: BaseGet<Function>,
        argsAtom: BaseAtom<mixed[]>
    ) {
        this._autorun = mobx.autorun
        this._argsAtom = argsAtom
        const instanceFactory = createInstanceFactory(
            create,
            this._argsAtom,
            protoAtom,
            this
        )
        this._value = mobx.computed(instanceFactory)
    }

    setArgs(opts: mixed[]): void {
        this._argsAtom.set(opts)
    }

    set(_opts: V): void {
        throw new Error('Can\'t set value, use setArgs instead')
    }

    get(): V {
        return this._value.get()
    }

    subscribe(fn: (v: V) => void): () => void {
        return this._value.observe(fn)
    }
}

export default function createMobxAtomizer<V: Object>(mobx: Mobx, isHotReplace: boolean): Atomizer {
    function createMobxAtom(
        create: CreateInstance<V>,
        protoAtom: BaseGet<Function>,
        argsAtom: BaseAtom<mixed[]>
    ): Atom<V> {
        return new MobxInstanceAtom(mobx, create, protoAtom, argsAtom)
    }

    function createAtom(value: V): Atom<V> {
        return new MobxValueAtom(mobx, value)
    }

    return new BaseAtomizer(
        createMobxAtom,
        mobx.transaction,
        createAtom,
        isHotReplace
    )
}
