// @flow
/* eslint-env mocha */

import assert from 'power-assert'
import atomixers from './atomixers'
import type {Rec} from './atomixers'

atomixers.forEach(([name, atomixer]: Rec) => {
    describe(`${name} base`, () => {
        it('raw object', () => {
            const atom = atomixer.value({a: 1})
            assert(atom.get().a === 1)
            atom.set({a: 2})
            assert(atom.get().a === 2)
        })

        it('class object', () => {
            class A {
                a: number
            }
            const a1 = new A()
            a1.a = 1

            const atom = atomixer.value(a1)
            assert(atom.get() instanceof A)
            assert(atom.get().a === 1)
            const a2 = new A()
            a2.a = 2
            atom.set(a2)
            assert(atom.get() instanceof A)
            assert(atom.get().a === 2)
        })

        it('class separate options and prototype', () => {
            class A {
                a: number
                constructor({a}: {a: number}) {
                    this.a = a
                }
            }
            const arg = atomixer.value({a: 1})
            const atom = atomixer.construct(A, [arg.get()])
            assert(atom.get() instanceof A)
            assert(atom.get().a === 1)
            arg.set({a: 2})
            assert(atom.get().a === 2)
        })

        it('function separate options and prototype', () => {
            const arg = atomixer.value({a: 1})
            function aFactory({a}: {a: number}): {a: number} {
                return {a}
            }
            const atom = atomixer.factory(aFactory, [arg.get()])
            assert(atom.get().a === 1)
            arg.set({a: 2})
            assert(atom.get().a === 2)
        })
    })
})
