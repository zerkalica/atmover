// @flow
/* eslint-env mocha */

import assert from 'power-assert'
import atomizers from './atomizers'
import type {Rec} from './atomizers'
import getAtom from '../getAtom'

atomizers.forEach(([name, atomizer]: Rec) => {
    describe(`${name} get atom`, () => {
        it('from constructed', () => {
            class A {}
            const a = atomizer.construct(A, [{a: 1}])
            const val = a.get()
            assert(typeof getAtom(val) === 'object')
        })

        it('from factory', () => {
            function A() {
                return {}
            }
            const a = atomizer.factory(A)
            const val = a.get()
            assert(typeof getAtom(val) === 'object')
        })

        it('from value', () => {
            const a = atomizer.value({a: 1})
            const val = a.get()
            assert(typeof getAtom(val) === 'object')
        })

        it('from value, after set', () => {
            const a = atomizer.value({a: 1})
            const atom = getAtom(a.get())
            a.set({a: 2})
            assert(getAtom(a.get()) === atom)
        })

        it('from value after update', () => {
            const a = atomizer.value({a: 1})
            a.get()
            a.set({a: 2})
            const val = a.get()
            assert(typeof getAtom(val) === 'object')
        })
    })
})
