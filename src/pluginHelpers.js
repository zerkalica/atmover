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
