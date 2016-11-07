// @flow
/* eslint-env mocha */

import assert from 'power-assert'
import plugins from './plugins'
import type {Rec} from './plugins'

plugins.forEach(([name, atmover]: Rec) => {
    describe(`${name} base`, () => {
        it('raw object', () => {
            const atom = atmover.value({a: 1})
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

            const atom = atmover.value(a1)
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
            const arg = atmover.value({a: 1})
            const atom = atmover.construct(A, [arg])
            assert(atom.get() instanceof A)
            assert(atom.get().a === 1)
            arg.set({a: 2})
            assert(atom.get().a === 2)
        })

        it('function separate options and prototype', () => {
            const arg = atmover.value({a: 1})
            function aFactory({a}: {a: number}): {a: number} {
                return {a}
            }
            const atom = atmover.factory(aFactory, [arg])
            assert(atom.get().a === 1)
            arg.set({a: 2})
            assert(atom.get().a === 2)
        })
    })
})
