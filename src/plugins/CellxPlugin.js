// @flow

import type {Atom, AtomSetter, Transact, IInstanceFactory} from '../interfaces'
import {createAttachMeta} from '../pluginHelpers'

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
}

class CellxInstanceAtom<V: Object | Function> {
    _value: any // CellxAtom<BoxedValue<V>>
    _factory: IInstanceFactory<V>

    constructor(
        cellx: Cellx,
        factory: IInstanceFactory<V>
    ) {
        factory.setAtom(this)
        this._factory = factory
        this._value = cellx(factory.get)
    }

    set(_opts: V): void {
        throw new Error('Can\'t set value on derivable, use source instead')
    }

    get(): V {
        return this._value()
    }

    subscribe(fn: (v: V) => void, err?: (e: Error) => void): () => void {
        const value = this._value

        function listener(error: Error, evt: {
            type: string;
            value: V
        }): void {
            if (error && err) {
                err(error)
            } else {
                fn(evt.value)
            }
        }
        value('subscribe', listener)

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
        cellx.configure({asynchronous: false})
        this.transact = cellx.transact
    }

    createInstanceAtom<V: Object | Function>(
        factory: IInstanceFactory<V>
    ): Atom<V> {
        return new CellxInstanceAtom(this._cellx, factory)
    }

    createValueAtom<V: Object | Function>(value: V): AtomSetter<V> {
        return new CellxValueAtom(this._cellx, value)
    }
}
