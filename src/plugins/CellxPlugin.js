// @flow

import type {Computed, Atom, Transact, IInstanceFactory} from '../interfaces'
import {attachMeta} from '../pluginHelpers'

interface ICellEvent<V> {
    oldValue: V;
    value: V;
}

type CellListener<V> = (err: Error, evt: ICellEvent<V>) => boolean | void

interface Cell<T> {
    (v: T): Cell<T>;
    (f: () => T): Cell<T>;
    subscribe(listener: CellListener<T>): Cell<T>;
    unsubscribe(listener: CellListener<T>): Cell<T>;
    get(): T;
    set(value: T): Cell<T>;
}

interface ICellxOpts {
    asynchronous?: boolean;
}

interface Cellx {
    configure(opts: ICellxOpts): void;
    transact: Transact;
    Cell: Class<Cell<*>>;
}

export default class CellxPlugin {
    transact: Transact
    _CellxValueAtom: Class<Atom<any>>
    _CellxFunctionAtom: Class<Atom<any>>
    _CellXInstanceAtom: Class<Computed<any>>

    constructor(cellx: Cellx) {
        const Cell: any = cellx.Cell
        cellx.configure({asynchronous: false})
        this.transact = cellx.transact

        this._CellxValueAtom = class CellxValueAtom<V: Object> extends Cell {
            _attachMeta: (value: V) => V
            _oldValue: ?V

            constructor(
                value: V
            ) {
                super(value)
                this._attachMeta = attachMeta
                this._attachMeta(value)
            }

            set(value: V): void {
                super.set(this._attachMeta(value))
            }
        }

        this._CellxFunctionAtom = class CellxFunctionAtom<V: Function> extends Cell {
            constructor(v: V) {
                /* eslint-disable */
                super({v})
            }

            set(v: V): void {
                super.set({v})
            }

            get(): V {
                return super.get().v
            }
        }

        this._CellXInstanceAtom = class CellxInstanceAtom<V: Object | Function> extends Cell {
            _oldValue: ?V

            constructor(factory: IInstanceFactory<V>) {
                super(factory.get)
                factory.setAtom(this)
            }

            subscribe(fn: (v: V) => void, err?: (e: Error) => void): () => void {
                function listener(error: Error, evt: ICellEvent<V>): void {
                    if (error && err) {
                        err(error)
                    } else {
                        fn(evt.value)
                    }
                }
                super.subscribe(listener)

                const unsubscribe = () => {
                    this.unsubscribe(listener)
                }

                return unsubscribe
            }
        }
    }

    createInstanceAtom<V: Object | Function>(
        factory: IInstanceFactory<V>
    ): Computed<V> {
        return new this._CellXInstanceAtom(factory)
    }

    createValueAtom<V: Object | Function>(value: V): Atom<V> {
        return typeof value === 'function'
            ? new this._CellxFunctionAtom(value)
            : new this._CellxValueAtom(value)
    }
}
