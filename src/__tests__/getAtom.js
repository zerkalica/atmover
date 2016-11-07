// @flow
/* eslint-env mocha */

import assert from 'power-assert'
import plugins from './plugins'
import type {Rec} from './plugins'
import getAtom from '../getAtom'

plugins.forEach(([name, atmover]: Rec) => {
    describe(`${name} get atom`, () => {
        it('from constructed', () => {
            class A {}
            const v = atmover.value({a: 1})
            const a = atmover.construct(A, [v])
            const val = a.get()
            assert(typeof getAtom(val) === 'object')
        })

        it('from factory', () => {
            function A() {
                return {}
            }
            const a = atmover.factory(A)
            const val = a.get()
            assert(typeof getAtom(val) === 'object')
        })

        it('from value', () => {
            const a = atmover.value({a: 1})
            const val = a.get()
            assert(typeof getAtom(val) === 'object')
        })

        it('from value, after set', () => {
            const a = atmover.value({a: 1})
            const atom = getAtom(a.get())
            a.set({a: 2})
            assert(getAtom(a.get()) === atom)
        })

        it('from value after update', () => {
            const a = atmover.value({a: 1})
            a.get()
            a.set({a: 2})
            const val = a.get()
            assert(typeof getAtom(val) === 'object')
        })
    })
})
