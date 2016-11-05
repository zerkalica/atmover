// @flow
/* eslint-env mocha */

import assert from 'power-assert'
import sinon from 'sinon'

import atomizers from './atomizers'
import type {Rec} from './atomizers'

atomizers.forEach(([name, atomizer]: Rec) => {
    describe(`${name} subscribe`, () => {
        it('value', () => {
            const v1 = {a: 1}
            const atom = atomizer.value(v1)
            const listener = sinon.spy()
            const unsubscribe = atom.subscribe(listener)
            const v2 = {a: 2}
            atom.set(v2)
            unsubscribe()
            assert(listener.calledOnce)
            assert(listener.firstCall.calledWith(
                sinon.match.same(v2)
            ))
        })

        it('instance', () => {
            class A {
                v: number
                constructor(v: number) {
                    this.v = v
                }
            }
            const atom = atomizer.construct(A, [1])
            const listener = sinon.spy()
            const unsubscribe = atom.subscribe(listener)
            atom.setArgs([2])
            assert(listener.calledOnce)
            assert(listener.firstCall.calledWith(
                sinon.match.instanceOf(A)
                    .and(sinon.match({v: 2}))
            ))
            unsubscribe()
        })

        it('not listen after unsubscribe', () => {
            const atom = atomizer.value({a: 1})
            const listener = sinon.spy()
            const unsubscribe = atom.subscribe(listener)
            unsubscribe()
            const v2 = {a: 2}
            atom.set(v2)
            assert(listener.notCalled)
        })

        it('subscribe twice', () => {
            const v1 = {a: 1}
            const atom = atomizer.value(v1)
            const listener1 = sinon.spy()
            const listener2 = sinon.spy()
            const unsubscribe1 = atom.subscribe(listener1)
            const unsubscribe2 = atom.subscribe(listener2)
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
