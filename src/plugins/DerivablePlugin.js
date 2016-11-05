// @flow

import type {Atom, Transact, CreateInstance, BaseGet, BaseAtom} from '../interfaces'
import {createInstanceFactory, createAttachMeta} from '../pluginHelpers'

interface LifeCycle {
    until?: Derivable<boolean>;
}

type IsEqual<V> = (old: V, newValue: V) => boolean

interface Derivable<V> {
    get(): V;
    withEquality(isEqual: IsEqual<V>): Derivable<V>;
    react(fn: (v: V) => void, lc?: ?LifeCycle): void;
}

interface DerivableAtom<V> extends Derivable<V> {
    set(v: V): void;
}

interface DerivableJS {
    transact(f: () => void): void;
    atom<V>(value: V): DerivableAtom<V>;
    derivation<T>(f: () => T): Derivable<T>;
}

type CreateAtom<V> = (value: V) => DerivableAtom<V>

class DerivableInstanceAtom<V: Object> {
    _createAtom: CreateAtom<*>
    _argsAtom: BaseAtom<mixed[]>
    _value: Derivable<V>

    constructor(
        derivable: DerivableJS,
        create: CreateInstance<V>,
        protoAtom: BaseGet<Function>,
        argsAtom: BaseAtom<mixed[]>
    ) {
        this._createAtom = derivable.atom
        this._argsAtom = argsAtom
        this._value = derivable.derivation(createInstanceFactory(
            create,
            this._argsAtom,
            protoAtom,
            this
        ))
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
        const until = this._createAtom(false)
        this._value.react(fn, {
            skipFirst: true,
            until
        })

        return function unsubscribe(): void {
            until.set(true)
        }
    }
}

class DerivableValueAtom<V: Object> {
    _createAtom: CreateAtom<*>
    _value: DerivableAtom<V>
    _attachMeta: (value: V) => V

    constructor(
        derivable: DerivableJS,
        value: V
    ) {
        this._createAtom = derivable.atom
        this._attachMeta = createAttachMeta(this)
        this._value = derivable.atom(this._attachMeta(value))
    }

    setArgs(_opts: mixed[]): void {
        throw new Error('Can\'t set args, use set instead')
    }

    set(value: V): void {
        this._value.set(this._attachMeta(value))
    }

    get(): V {
        return this._value.get()
    }
    subscribe(fn: (v: V) => void): () => void {
        const until = this._createAtom(false)
        this._value.react(fn, {
            skipFirst: true,
            until
        })

        return function unsubscribe(): void {
            until.set(true)
        }
    }
}

export default class MobxPlugin {
    _derivable: DerivableJS
    transact: Transact

    constructor(derivable: DerivableJS) {
        this._derivable = derivable
        this.transact = derivable.transact
    }

    createInstanceAtom<V: Object>(
        create: CreateInstance<V>,
        protoAtom: BaseGet<Function>,
        argsAtom: BaseAtom<mixed[]>
    ): Atom<V> {
        return new DerivableInstanceAtom(this._derivable, create, protoAtom, argsAtom)
    }

    createValueAtom<V: Object>(value: V): Atom<V> {
        return new DerivableValueAtom(this._derivable, value)
    }
}
