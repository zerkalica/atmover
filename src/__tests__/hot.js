// @flow
/* eslint-env mocha */

import assert from 'power-assert'
import sinon from 'sinon'

import {onUpdate} from '../interfaces'
import plugins from './plugins'
import type {Rec} from './plugins'

plugins.forEach(([name, atmover]: Rec) => {
    describe(`${name} hot replace`, () => {
        it('class without deps', () => {
            class A {}
            class B extends A {}

            const atom = atmover.construct(A)
            assert(atom.get() instanceof A)
            atmover.replaceProto(A, B)
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

            const atom = atmover.construct(A)
            atom.get()
            atmover.replaceProto(A, B)
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
                constructor({a}: {a: number}) {
                    super(a + 1)
                }
            }
            const v = atmover.value({a: 1})
            const atom = atmover.construct(A, [v])
            v.set({a: 2})
            assert(atom.get() instanceof A)
            atmover.replaceProto(A, B)
            assert(atom.get() instanceof B)
            assert(atom.get().a === 3)
        })
    })

    it('replace twice', () => {
        class A {}
        class B extends A {}
        class C extends A {}

        const atom = atmover.construct(A)
        assert(atom.get() instanceof A)
        atmover.replaceProto(A, B)
        atmover.replaceProto(B, C)
        assert(atom.get() instanceof C)
    })
})
