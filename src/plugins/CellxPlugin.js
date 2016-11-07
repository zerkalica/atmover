// @flow

import type {Atom, Transact, CreateInstance, AtomGetter} from '../interfaces'
import {createInstanceFactory, createAttachMeta} from '../pluginHelpers'

interface CellxEvent<V> {
    oldValue: V;
    value: V;
}

type ListenerName = 'addChangeListener' | 'removeChangeListener'
type CellxListener<V> = (eventName: ListenerName, fn: (event: CellxEvent<V>) => void) => void
type CellxSet<V> = (v: V) => void
type CellxGet<V> = () => V

type CellxAtom<V> = CellxListener<V> | CellxSet<V> | CellxGet<V>

type Cellx = () => CellxAtom<any>

class BoxedValue<V> {
    v: V
    constructor(v: V) {
        this.v = v
    }
}

class CellxValueAtom<V: Object | Function> {
    _value: any // CellxAtom<BoxedValue<V>>
    _attachMeta: (value: V) => V

    constructor(
        cellx: Cellx,
        value: V
    ) {
        this._attachMeta = createAttachMeta(this)
        this._value = cellx(new BoxedValue(this._attachMeta(value)))
    }

    set(value: V): void {
        this._value(new BoxedValue(this._attachMeta(value)))
    }

    get(): V {
        return this._value().v
    }

    subscribe(fn: (v: V) => void): () => void {
        function changeListener(event: CellxEvent<BoxedValue<V>>): void {
            return fn(event.value.v)
        }

        this._value('addChangeListener', changeListener)
        const unsubscribe = () => {
            this._value('removeChangeListener', changeListener)
        }
        return unsubscribe
    }
}

class CellxInstanceAtom<V: Object | Function> {
    _value: any // CellxAtom<BoxedValue<V>>
    _isHandleErrors: boolean = false

    constructor(
        cellx: Cellx,
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

        this._value = cellx(createInstance)
    }

    set(_opts: V): void {
        throw new Error('Can\'t set value on derivable, use source instead')
    }

    get(): V {
        return this._value()
    }

    subscribe(fn: (v: V) => void, err?: (e: Error) => void): () => void {
        const value = this._value
        this._isHandleErrors = true

        function listener(
            error: Error,
            evt: {
                type: string;
                value: V
            }
        ): void {
            if (error && err) {
                err(error)
            } else {
                fn(evt.value)
            }
        }
        this._value('subscribe', listener)

        return function unsubscribe(): void {
            value('unsubscribe', listener)
        }
    }
}

export default class CellxPlugin {
    _cellx: Cellx
    transact: Transact

    constructor(cellx: Cellx) {
        this._cellx = cellx
        this.transact = function _transact(f: () => void): void {
            f()
            cellx.Cell.forceRelease()
        }
    }

    createInstanceAtom<V: Object | Function>(
        create: CreateInstance<V>,
        protoAtom: AtomGetter<Function>,
        argsAtom: AtomGetter<*>[]
    ): Atom<V> {
        return new CellxInstanceAtom(this._cellx, create, protoAtom, argsAtom)
    }

    createValueAtom<V: Object | Function>(value: V): Atom<V> {
        return new CellxValueAtom(this._cellx, value)
    }
}
