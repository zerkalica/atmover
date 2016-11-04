// @flow
/* eslint-env mocha */

import assert from 'power-assert'
import sinon from 'sinon'

import {onUpdate} from '../interfaces'
import atomizers from './atomizers'
import type {Rec} from './atomizers'

atomizers.forEach(([name, atomizer]: Rec) => {
    describe(`${name} hot replace`, () => {
        it('class without deps', () => {
            class A {}
            class B extends A {}

            const atom = atomizer.construct(A)
            assert(atom.get() instanceof A)
            atom.setProto(B)
            assert(atom.get() instanceof B)
        })

        it('class onUpdateHook on hot replace', () => {
            const onUpdateHook = sinon.spy()
            class A {
                // $FlowFixMe: computed property key not supported, see https://github.com/facebook/flow/issues/2286
                [onUpdate](next: A) {
                    onUpdateHook(next)
                }
            }
            class B extends A {}

            const atom = atomizer.construct(A)
            atom.get()
            atom.setProto(B)
            atom.get()
            assert(onUpdateHook.calledOnce)
            assert(onUpdateHook.firstCall.calledWith(sinon.match.instanceOf(B)))
        })

        it('class with deps', () => {
            class A {
                a: number
                constructor(a: number) {
                    this.a = a
                }
            }

            class B extends A {
                b: number
                constructor(a: number) {
                    super(a + 1)
                }
            }

            const atom = atomizer.construct(A, [1])
            atom.setArgs([2])
            assert(atom.get() instanceof A)
            atom.setProto(B)
            assert(atom.get() instanceof B)
            assert(atom.get().a === 3)
        })
    })
})
