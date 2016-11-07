// @flow
/* eslint-env mocha */

import assert from 'power-assert'
import sinon from 'sinon'

import plugins from './plugins'
import type {Rec} from './plugins'

plugins.forEach(([name, atmover]: Rec) => {
    describe(`${name} transact`, () => {
        it('value', () => {
            const v1 = {a: 1}
            const a1 = atmover.value(v1)
            const v2 = {a: 10}
            const a2 = atmover.value(v2)

            function factory(va1: {a: number}, va2: {a: number}): {b: number} {
                return {
                    b: va1.a + va2.a
                }
            }
            const c = atmover.factory(factory, [a1, a2])
            const fn = sinon.spy()
            c.subscribe(fn)
            atmover.transact(() => {
                a1.set({a: 2})
                a2.set({a: 11})
            })
            assert(fn.calledOnce)
            assert(c.get().b === 13)
        })
    })
})
