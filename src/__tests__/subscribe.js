// @flow
/* eslint-env mocha */

import assert from 'power-assert'
import sinon from 'sinon'

import atomizers from './atomizers'
import type {Rec} from './atomizers'

atomizers.forEach(([name, atomizer]: Rec) => {
    describe(`${name} subscribe`, () => {
        it('listen after subscribe', () => {
            const atom = atomizer.value({a: 1})
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

        it('not listen after usubscribe', () => {
            const atom = atomizer.value({a: 1})
            const listener = sinon.spy()
            const unsubscribe = atom.subscribe(listener)
            unsubscribe()
            const v2 = {a: 2}
            atom.set(v2)
            assert(listener.notCalled)
        })
    })
})
