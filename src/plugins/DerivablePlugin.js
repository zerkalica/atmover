// @flow

import type {Atom, AtomSetter, Transact, IInstanceFactory} from '../interfaces'
import {createAttachMeta, AtomError} from '../pluginHelpers'

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

class DerivableValueAtom<V: Object | Function> {
    _value: DerivableAtom<V>
    _attachMeta: (value: V) => V

    constructor(
        derivable: DerivableJS,
        value: V
    ) {
        this._attachMeta = createAttachMeta(this)
        this._value = derivable.atom(this._attachMeta(value))
    }

    set(value: V): void {
        this._value.set(this._attachMeta(value))
    }

    get(): V {
        return this._value.get()
    }
}

class DerivableInstanceAtom<V: Object | Function> {
    _createAtom: CreateAtom<*>
    _value: Derivable<V>
    _factory: IInstanceFactory<V>

    constructor(
        derivable: DerivableJS,
        factory: IInstanceFactory<V>
    ) {
        this._createAtom = derivable.atom
        factory.setAtom(this)

        this._value = derivable.derivation(factory.get)
        this._factory = factory
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
        const until = this._createAtom(false)
        const f = this._factory
        f.setSafeMode(true)
        this._value.react(f.createListener(fn, err), {
            skipFirst: true,
            until
        })

        return function unsubscribe(): void {
            until.set(true)
        }
    }
}

export default class DerivablePlugin {
    _derivable: DerivableJS
    transact: Transact

    constructor(derivable: DerivableJS) {
        this._derivable = derivable
        this.transact = derivable.transact
    }

    createInstanceAtom<V: Object | Function>(
        factory: IInstanceFactory<V>
    ): Atom<V> {
        return new DerivableInstanceAtom(this._derivable, factory)
    }

    createValueAtom<V: Object | Function>(value: V): AtomSetter<V> {
        return new DerivableValueAtom(this._derivable, value)
    }
}
