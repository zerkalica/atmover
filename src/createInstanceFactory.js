// @flow

import {metaKey, onUpdate} from './interfaces'
import type {BaseAtom, Atom} from './interfaces'

export default function createInstanceFactory<V: Object>(
    create: (proto: Class<V>, deps: mixed[]) => V,
    depsAtom: BaseAtom<mixed[]>,
    protoAtom: BaseAtom<Class<V>>,
    selfAtom: Atom<V>
): () => V {
    let oldValue: ?V = null
    return function instanceFactory(): V {
        const proto: Class<V> = protoAtom.get()
        const deps: mixed[] = depsAtom.get()
        const value = create(proto, deps)
        value[metaKey] = selfAtom // eslint-disable-line
        if (oldValue && oldValue[onUpdate]) {
            oldValue[onUpdate].call(oldValue, value, deps)
        }
        oldValue = value
        return value
    }
}

export function createGetArgs(args: Atom<*>[]): () => mixed[] {
    return function getArgs(): mixed[] {
        const result: mixed[] = new Array(args.length)
        for (let i = 0, l = args.length; i < l; i++) {
            result[i] = args[i].get()
        }
        return result
    }
}
