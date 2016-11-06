// @flow
/* eslint-env mocha */

import assert from 'power-assert'
import atomixers from './atomixers'
import type {Rec} from './atomixers'
import getAtom from '../getAtom'

atomixers.forEach(([name, atomixer]: Rec) => {
    describe(`${name} get atom`, () => {
        it('from constructed', () => {
            class A {}
            const v = atomixer.value({a: 1})
            const a = atomixer.construct(A, [v])
            const val = a.get()
            assert(typeof getAtom(val) === 'object')
        })

        it('from factory', () => {
            function A() {
                return {}
            }
            const a = atomixer.factory(A)
            const val = a.get()
            assert(typeof getAtom(val) === 'object')
        })

        it('from value', () => {
            const a = atomixer.value({a: 1})
            const val = a.get()
            assert(typeof getAtom(val) === 'object')
        })

        it('from value, after set', () => {
            const a = atomixer.value({a: 1})
            const atom = getAtom(a.get())
            a.set({a: 2})
            assert(getAtom(a.get()) === atom)
        })

        it('from value after update', () => {
            const a = atomixer.value({a: 1})
            a.get()
            a.set({a: 2})
            const val = a.get()
            assert(typeof getAtom(val) === 'object')
        })
    })
})
