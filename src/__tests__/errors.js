// @flow
/* eslint-env mocha */
/* eslint-disable no-console */

import assert from 'power-assert'
import sinon from 'sinon'
import plugins from './plugins'
import type {
    Rec
} from './plugins'

plugins.forEach(([name, atmover]: Rec) => {
    describe(`${name} errors in computed`, () => {
        beforeEach(() => {
            sinon.spy(console, 'error')
        })

        afterEach(() => {
            console.error.restore()
        })

        it('get should return undefined', () => {
            const v1 = {
                a: 1
            }
            const a1 = atmover.value(v1)

            function factory(_va1: {
                a: number
            }): {
                b: number
            } {
                throw new Error('ATOM_FAIL!')
            }

            const c = atmover.factory(factory, [a1])
            const fn = sinon.spy()
            const err = sinon.spy()

            assert(console.error.notCalled)
            c.subscribe(fn, err)
            assert(console.error.calledOnce)
            // assert(console.error.calledWith(
            //     sinon.match(/ATOM_FAIL!/)
            // ))

            assert(c.get() === undefined)
        })

        it('get should not call error handler', () => {
            const v1 = {
                a: 1
            }
            const a1 = atmover.value(v1)

            function factory(_va1: {
                a: number
            }): {
                b: number
            } {
                throw new Error('ATOM_FAIL!')
            }

            const c = atmover.factory(factory, [a1])
            const fn = sinon.spy()
            const err = sinon.spy()
            c.subscribe(fn, err)
            c.get()
            assert(err.notCalled)
        })

        it('after set', () => {
            const v1 = {
                a: 1
            }
            const a1 = atmover.value(v1)
            const v2 = {
                a: 10
            }
            const a2 = atmover.value(v2)
            let count: number = 0

            function factory(_va1: {
                a: number
            }, _va2: {
                a: number
            }): {
                b: number
            } {
                if (count >= 1) {
                    throw new Error('ATOM_FAIL!')
                }
                ++count // eslint-disable-line
                return {
                    b: 1
                }
            }

            const c = atmover.factory(factory, [a1, a2])
            const fn = sinon.spy()
            const err = sinon.spy()
            c.subscribe(fn, err)
            assert(console.error.notCalled)
            atmover.transact(() => {
                a1.set({
                    a: 2
                })
            })
            assert(console.error.calledOnce)
            // assert(console.error.calledWith(
            //     sinon.match(/ATOM_FAIL!/)
            // ))
            assert(err.calledOnce)
            assert(err.firstCall.calledWith(
                sinon.match.instanceOf(Error)
            ))
        })
    })
})
