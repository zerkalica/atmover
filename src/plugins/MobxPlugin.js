// @flow

import type {Atom, AtomSetter, Transact, IInstanceFactory} from '../interfaces'
import {createAttachMeta, AtomError} from '../pluginHelpers'

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
}

class MobxInstanceAtom<V: Object | Function> {
    _value: MobxAtom<V>
    _factory: IInstanceFactory<V>

    constructor(
        mobx: Mobx,
        factory: IInstanceFactory<V>
    ) {
        this._factory = factory
        factory.setAtom(this)
        this._value = mobx.computed(factory.get)
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
        return this._value.observe(this._factory.setSafeMode(true).createListener(fn, err))
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
        factory: IInstanceFactory<V>
    ): Atom<V> {
        return new MobxInstanceAtom(this._mobx, factory)
    }

    createValueAtom<V: Object | Function>(value: V): AtomSetter<V> {
        return new MobxValueAtom(this._mobx, value)
    }
}
