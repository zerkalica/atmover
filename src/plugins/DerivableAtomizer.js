// @flow

import type {BaseAtom, Atom, Atomizer, Fn} from '../interfaces'
import createInstanceFactory, {createGetArgs} from '../createInstanceFactory'
import {fastCreateObject, fastCall} from '../fastCreate'
import debugName from '../debugName'

interface LifeCycle {
    until?: Derivable<boolean>;
}

type IsEqual<V> = (old: V, newValue: V) => boolean

interface Derivable<V> {
    get(): V;
    withEquality(isEqual: IsEqual<V>): Derivable<V>;
    derive<E>(f: (value: V) => E): Derivable<E>;
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

type CreateDerivable<T> = (f: () => T) => Derivable<T>
type CreateAtom<V> = (value: V) => DerivableAtom<V>

class DerivableJsAtom<V> {
    _createAtom: CreateAtom<*>
    _protoAtom: BaseAtom<Class<V>>
    _args: BaseAtom<mixed[]>
    valueDerivable: Derivable<V>

    constructor(
        createAtom: CreateAtom<*>,
        protoAtom: BaseAtom<Class<V>>,
        args: BaseAtom<mixed[]>
    ) {
        this._createAtom = createAtom
        this._protoAtom = protoAtom
        this._args = args
    }

    setProto(proto: Class<V>): void {
        this._protoAtom.set(proto)
    }

    setArgs(opts: mixed[]): void {
        this._args.set(opts)
    }

    set(opts: V): void {
        this._args.set((opts: any))
    }

    get(): V {
        return this.valueDerivable.get()
    }

    subscribe(fn: (v: V) => void): () => void {
        const until = this._createAtom(false)
        this.valueDerivable.react(fn, {
            skipFirst: true,
            until
        })
        return function unsubscribe(): void {
            until.set(true)
        }
    }
}

class FakeBaseAtom<V> {
    _args: V

    constructor(args: V) {
        this._args = args
    }

    get(): V {
        return this._args
    }

    set(_v: V): void {
        throw new Error('Can\'t set non-atom values')
    }
}

const fakeDepsAtom: BaseAtom<mixed[]> = new FakeBaseAtom([])

function passArgs<V: Object>(p: Class<V>, d: mixed[]): V {
    return (d: any)
}

export default class DerivableAtomizer {
    _createDerivable: CreateDerivable<any>
    _createAtom: CreateAtom<any>
    _isHotReplace: boolean

    transact: (fn: () => void) => void

    constructor(derivable: DerivableJS, isHotReplace?: boolean) {
        this._createAtom = derivable.atom
        this._createDerivable = derivable.derivation
        this.transact = derivable.transact
        this._isHotReplace = isHotReplace || false
    }

    _derivableToBase(fn: () => mixed[]): BaseAtom<mixed[]> {
        const v: Derivable<mixed[]> = this._createDerivable(fn)
        ;(v: Object).set = function set(): void {
            throw new Error(`Can't set arguments on computable: ${debugName(fn)}`)
        }
        return (v: Object)
    }

    _createArgsDerive(args?: Atom<*>[]): BaseAtom<mixed[]> {
        return args ? this._derivableToBase(createGetArgs(args)) : fakeDepsAtom
    }

    _createArgsAtom(args?: mixed[]): BaseAtom<mixed[]> {
        return args ? this._createAtom(args) : fakeDepsAtom
    }

    _construct<V: Object>(
        p: Function,
        argsAtom: BaseAtom<mixed[]>,
        create: (proto: Function, argsAtom: mixed[]) => V
    ): Atom<V> {
        const protoAtom: BaseAtom<Function> = this._isHotReplace
            ? this._createAtom(p)
            : new FakeBaseAtom(p)

        const atom = new DerivableJsAtom(this._createAtom, protoAtom, argsAtom)
        atom.valueDerivable = this._createDerivable(createInstanceFactory(
            create,
            argsAtom,
            protoAtom,
            atom
        ))
        return atom
    }

    value<V: Object>(v: V): Atom<V> {
        return this._construct(Object, this._createAtom(v), passArgs)
    }

    construct<V: Object>(p: Class<V> | Fn<V>, args?: mixed[]): Atom<V> {
        return this._construct(
            p,
            this._createArgsAtom(args),
            fastCreateObject
        )
    }

    factory<V: Object>(p: Fn<V>, args?: mixed[]): Atom<V> {
        return this._construct(p, this._createArgsAtom(args), fastCall)
    }

    constructComputed<V: Object>(p: Class<V>, args?: Atom<*>[]): Atom<V> {
        return this._construct(
            p,
            this._createArgsDerive(args),
            fastCreateObject
        )
    }

    factoryComputed<V: Object>(p: Fn<V>, args?: Atom<*>[]): Atom<V> {
        return this._construct(
            p,
            this._createArgsDerive(args),
            fastCall
        )
    }
}
if (0) ((new DerivableAtomizer(...(0: any))): Atomizer) // eslint-disable-line
