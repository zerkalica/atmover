// @flow
/* eslint-env mocha */

import assert from 'power-assert'
import sinon from 'sinon'

import plugins from './plugins'
import type {Rec} from './plugins'

plugins.forEach(([name, atmover]: Rec) => {
    const pass = (v: any) => v

    describe(`${name} subscribe`, () => {
        it('instance', () => {
            class A {
                v: number
                constructor({v}: {v: number}) {
                    this.v = v
                }
            }
            const arg = atmover.value({v: 1})
            const atom = atmover.construct(A, [arg])
            const listener = sinon.spy()
            const unsubscribe = atom.subscribe(listener)
            arg.set({v: 2})

            assert(listener.calledOnce)
            assert(listener.firstCall.calledWith(
                sinon.match.instanceOf(A)
                    .and(sinon.match({v: 2}))
            ))
            unsubscribe()
        })

        it('not listen after unsubscribe', () => {
            const atom = atmover.value({a: 1})
            const listener = sinon.spy()
            const computable = atmover.factory(pass, [atom])
            const unsubscribe = computable.subscribe(listener)
            unsubscribe()
            const v2 = {a: 2}
            atom.set(v2)
            assert(listener.notCalled)
        })

        it('subscribe twice', () => {
            const v1 = {a: 1}
            const atom = atmover.value(v1)
            const listener1 = sinon.spy()
            const listener2 = sinon.spy()

            const computable = atmover.factory(pass, [atom])
            const unsubscribe1 = computable.subscribe(listener1)
            const unsubscribe2 = computable.subscribe(listener2)

            const v2 = {a: 2}
            atom.set(v2)

            assert(listener1.calledOnce)
            assert(listener1.firstCall.calledWith(
                sinon.match.same(v2)
            ))

            assert(listener2.calledOnce)
            assert(listener2.firstCall.calledWith(
                sinon.match.same(v2)
            ))

            unsubscribe1()
            unsubscribe2()
        })
    })
})
