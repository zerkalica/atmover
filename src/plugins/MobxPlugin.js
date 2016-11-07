// @flow

import type {Atom, CreateInstance, AtomGetter, Transact} from '../interfaces'
import {createInstanceFactory, createAttachMeta, invokeDerivable, AtomError, createListener} from '../pluginHelpers'

interface MobxAtom<V> {
    get(): V;
    set(v: V): void;
    observe(fn: (v: V) => void): () => void;
}

interface Mobx {
    transaction(fn: () => void): void;
    computed<V>(fn: () => V): MobxAtom<V>;
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

    constructor(
        mobx: Mobx,
        value: V
    ) {
        this._attachMeta = createAttachMeta(this)
        this._value = mobx.observable(new BoxedValue(this._attachMeta(value)))
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

class MobxInstanceAtom<V: Object | Function> {
    _value: MobxAtom<V>
    _isHandleErrors: boolean = false

    constructor(
        mobx: Mobx,
        create: CreateInstance<V>,
        proto: AtomGetter<Function>,
        args: AtomGetter<*>[]
    ) {
        const createInstance: () => V = createInstanceFactory(
            create,
            args,
            proto,
            createAttachMeta(this)
        )

        const createHandledInstance: () => V = () => {
            return this._isHandleErrors
                ? (invokeDerivable(createInstance): any)
                : createInstance()
        }

        this._value = mobx.computed(createHandledInstance)
    }

    set(_opts: V): void {
        throw new Error('Can\'t set value on derivable, use source instead')
    }

    get(): V {
        const value = this._value.get()
        if (value instanceof AtomError) {
            return (undefined: any)
        }
        return value
    }

    subscribe(fn: (v: V) => void, err?: (e: Error) => void): () => void {
        this._isHandleErrors = true
        return this._value.observe(createListener(fn, err))
    }
}

export default class MobxPlugin {
    _mobx: Mobx
    transact: Transact

    constructor(mobx: Mobx) {
        this._mobx = mobx
        this.transact = mobx.transaction
    }

    createInstanceAtom<V: Object | Function>(
        create: CreateInstance<V>,
        protoAtom: AtomGetter<Function>,
        argsAtom: AtomGetter<*>[]
    ): Atom<V> {
        return new MobxInstanceAtom(this._mobx, create, protoAtom, argsAtom)
    }

    createValueAtom<V: Object | Function>(value: V): Atom<V> {
        return new MobxValueAtom(this._mobx, value)
    }
}
