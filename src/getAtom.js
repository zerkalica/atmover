// @flow

import type {Atom} from './interfaces'
import {metaKey} from './interfaces'
import debugName from './debugName'

export default function getAtom<V: Object>(rec: V): Atom<V> {
    if (!rec || typeof rec !== 'object') {
        throw new Error('Empty source value')
    }
    const v = rec[metaKey]
    if (!v) {
        throw new Error(`No meta found in value: ${debugName(rec)}`)
    }
    return rec[metaKey]
}
