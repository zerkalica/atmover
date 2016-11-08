// @flow

import {metaKey, onUpdate} from './interfaces'
import type {AtomGetter, Computed, AtomArg, NormalizedAtomArg, NormalizedAtomArgs} from './interfaces'

type AttachMeta<V> = (value: V, deps?: ?mixed[]) => V

export function createAttachMeta<V: Object>(selfAtom: AtomGetter<V>): AttachMeta<V> {
    let oldValue: ?V = null
    return function attachMeta(value: V): V {
        value[metaKey] = selfAtom // eslint-disable-line
        if (oldValue && oldValue[onUpdate]) {
            oldValue[onUpdate].call(oldValue, value)
        }
        oldValue = value
        return value
    }
}

function normalizeArgs(args: AtomArg[]): NormalizedAtomArg[] {
    const result: NormalizedAtomArg[] = []
    for (let i = 0, l = args.length; i < l; i++) {
        const value = args[i]
        if (!value.get) {
            const values = []
            for (let key in value) { // eslint-disable-line
                values.push({key, value: (value: any)[key]})
            }
            result.push({
                id: 2,
                values
            })
        } else {
            result.push({
                id: 1,
                value
            })
        }
    }

    return result
}

class ArgsAtomGetter {
    _args: NormalizedAtomArg[]
    _deps: any[]

    constructor(rawArgs: ?(AtomArg[] | NormalizedAtomArgs)) {
        if (rawArgs && (rawArgs: any).id === 3) {
            this._args = (rawArgs: any).args
        } else {
            this._args = rawArgs ? normalizeArgs((rawArgs: any)) : []
        }
        this._deps = new Array(this._args.length)
    }

    get(): mixed[] {
        const args = this._args
        const deps = this._deps
        for (let i = 0, l = args.length; i < l; i++) {
            const arg: NormalizedAtomArg = args[i]
            if (arg.id === 1) {
                deps[i] = arg.value.get()
            } else {
                const values = arg.values
                let target: {[id: string]: NormalizedAtomArg} = deps[i]
                if (!target) {
                    target = deps[i] = {}
                }
                for (let j = 0, k = values.length; j < k; j++) {
                    const rec = values[j]
                    target[rec.key] = rec.value.get()
                }
            }
        }

        return deps
    }
}

export class AtomError {
    error: Error

    constructor(error: Error) {
        this.error = error
    }
}

export class InstanceFactory<V: Object> {
    _args: AtomGetter<mixed[]>
    _protoAtom: AtomGetter<Function>
    _create: (proto: Class<V>, deps: mixed[]) => V

    _attachMeta: AttachMeta<V>
    _isSafe: boolean = false

    constructor(
        args: ?(AtomArg[] | NormalizedAtomArgs),
        protoAtom: AtomGetter<Function>,
        create: (proto: Class<V>, deps: mixed[]) => V
    ) {
        this._args = new ArgsAtomGetter(args)
        this._protoAtom = protoAtom
        this._create = create
    }

    setAtom(atom: Computed<V>): InstanceFactory<V> {
        this._attachMeta = createAttachMeta(atom)
        return this
    }

    get: () => V = () => {
        return this._isSafe ? this._getSafe() : this._get()
    }

    setSafeMode(isSafe: boolean): InstanceFactory<V> {
        this._isSafe = isSafe

        return this
    }

    _get(): V {
        return this._attachMeta(this._create(this._protoAtom.get(), this._args.get()))
    }

    _getSafe(): V {
        try {
            return this._get()
        } catch (error) {
            /* eslint-disable no-console */
            console.error(error)
            return (new AtomError(error): any)
        }
    }

    createListener(
        fn: (v: V) => void,
        err?: (e: Error) => void
    ): (v: V) => void {
        return function listener(v: V): void {
            if (v instanceof AtomError) {
                if (err) {
                    err(v.error)
                }
            } else {
                fn(v)
            }
        }
    }
}
