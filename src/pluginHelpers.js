// @flow

import {metaKey, onUpdate} from './interfaces'
import type {BaseGet, Atom} from './interfaces'

export function createAttachMeta<V: Object>(selfAtom: Atom<V>): (value: V, deps?: ?mixed[]) => V {
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
    argsAtom: BaseGet<mixed[]>,
    protoAtom: BaseGet<Function>,
    selfAtom: Atom<V>
): () => V {
    const attachMeta = createAttachMeta(selfAtom)

    return function instanceFactory(): V {
        const deps: mixed[] = argsAtom.get()
        return attachMeta(create(protoAtom.get(), deps), deps)
    }
}
