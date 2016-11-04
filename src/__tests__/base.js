// @flow
/* eslint-env mocha */

import assert from 'power-assert'
import sinon from 'sinon'

import {onUpdate} from '../interfaces'
import atomizers from './atomizers'
import type {Rec} from './atomizers'

atomizers.forEach(([name, atomizer]: Rec) => {
    describe(`${name} base`, () => {
        it('raw object', () => {
            const atom = atomizer.value({a: 1})
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

            const atom = atomizer.value(a1)
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
                constructor(a: number) {
                    this.a = a
                }
            }

            const atom = atomizer.construct(A, [1])
            assert(atom.get() instanceof A)
            assert(atom.get().a === 1)
            atom.setArgs([2])
            assert(atom.get().a === 2)
        })

        it('class onUpdateHook on changing deps', () => {
            const onUpdateHook = sinon.spy()
            class A {
                a: number

                constructor(a: number) {
                    this.a = a
                }

                // $FlowFixMe: computed property key not supported, see https://github.com/facebook/flow/issues/2286
                [onUpdate](next: A) {
                    onUpdateHook(next)
                }
            }

            const atom = atomizer.construct(A, [1])
            atom.get()
            atom.setArgs([2])
            atom.get()
            assert(onUpdateHook.calledOnce)
            assert(onUpdateHook.firstCall.calledWith(sinon.match.instanceOf(A)))
        })

        it('function separate options and prototype', () => {
            function aFactory(a: number): {a: number} {
                return {a}
            }
            const atom = atomizer.factory(aFactory, [1])
            assert(atom.get().a === 1)
            atom.setArgs([2])
            assert(atom.get().a === 2)
        })
    })
})
