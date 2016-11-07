// @flow

import {metaKey, onUpdate} from './interfaces'
import type {AtomGetter, Atom} from './interfaces'

type AttachMeta<V> = (value: V, deps?: ?mixed[]) => V

export function createAttachMeta<V: Object>(selfAtom: Atom<V>): AttachMeta<V> {
    let oldValue: ?V = null
    return function attachMeta(value: V, deps?: ?mixed[]): V {
        value[metaKey] = selfAtom // eslint-disable-line
        if (oldValue && oldValue[onUpdate]) {
            oldValue[onUpdate].call(oldValue, value, deps)
        }
        oldValue = value
        return value
    }
}

export function createInstanceFactory<V: Object>(
    create: (proto: Class<V>, deps: mixed[]) => V,
    args: AtomGetter<*>[],
    protoAtom: AtomGetter<Function>,
    attachMeta: AttachMeta<V>
): () => V {
    return function instanceFactory(): V {
        const deps: mixed[] = []
        for (let i = 0, l = args.length; i < l; i++) {
            deps[i] = args[i].get()
        }

        return attachMeta(create(protoAtom.get(), deps), deps)
    }
}

export class AtomError {
    error: Error

    constructor(error: Error) {
        this.error = error
    }
}

export function invokeDerivable<V: Object | Function>(fn: () => V): V | AtomError {
    try {
        return fn()
    } catch (error) {
        /* eslint-disable no-console */
        console.error(error)
        return new AtomError(error)
    }
}

export function createListener<V>(
    fn: (v: V) => void,
    err?: (e: Error) => void
): (v: V | AtomError) => void {
    return function listener(v: V | AtomError): void {
        if (v instanceof AtomError) {
            if (err) {
                err(v.error)
            }
        } else {
            fn(v)
        }
    }
}
