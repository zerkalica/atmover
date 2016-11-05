// @flow

import type {Atom, CreateInstance, BaseGet, BaseAtom, Transact} from '../interfaces'
import {createInstanceFactory, createAttachMeta} from '../pluginHelpers'

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

export default class MobxPlugin {
    _mobx: Mobx
    transact: Transact

    constructor(mobx: Mobx) {
        this._mobx = mobx
        this.transact = mobx.transaction
    }

    createInstanceAtom<V: Object>(
        create: CreateInstance<V>,
        protoAtom: BaseGet<Function>,
        argsAtom: BaseAtom<mixed[]>
    ): Atom<V> {
        return new MobxInstanceAtom(this._mobx, create, protoAtom, argsAtom)
    }

    createValueAtom<V: Object>(value: V): Atom<V> {
        return new MobxValueAtom(this._mobx, value)
    }
}
