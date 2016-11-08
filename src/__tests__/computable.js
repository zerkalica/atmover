// @flow
/* eslint-env mocha */

import sinon from 'sinon'
import assert from 'power-assert'
import plugins from './plugins'
import {onUpdate} from '../interfaces'
import type {Rec} from './plugins'

plugins.forEach(([name, atmover]: Rec) => {
    describe(`${name} computable`, () => {
        it('class', () => {
            type BOpts = {a: number}

            const a = atmover.value(({a: 1}: BOpts))

            class B {
                _b: number
                constructor(opts: BOpts) {
                    this._b = opts.a
                }
            }

            const b = atmover.construct(B, [a])
            assert(b.get()._b === 1)
            a.set({a: 2})
            assert(b.get()._b === 2)
        })

        it('object as arg', () => {
            type BOpts = {a: number}

            const a = atmover.value(({a: 1}: BOpts))
            const b = atmover.value(({a: 2}: BOpts))

            class C {
                _b: number
                _b2: number
                constructor(opts: BOpts, rec: {b: BOpts}) {
                    this._b = opts.a
                    this._b2 = rec.b.a
                }
            }

            const c = atmover.construct(C, [a, {b}])
            assert(c.get()._b2 === 2)
        })

        it('factory', () => {
            type BOpts = {a: number}

            const a = atmover.value(({a: 1}: BOpts))

            function bFactory(opts: BOpts) {
                return {_b: opts.a}
            }

            const b = atmover.factory(bFactory, [a])
            assert(b.get()._b === 1)
            a.set({a: 2})
            assert(b.get()._b === 2)
        })

        it('class onUpdateHook on changing deps', () => {
            const onUpdateHook = sinon.spy()
            const val = atmover.value({a: 1})
            class A {
                a: number

                constructor({a}: {a: number}) {
                    this.a = a
                }

                // $FlowFixMe: computed property key not supported, see https://github.com/facebook/flow/issues/2286
                [onUpdate](next: A) {
                    onUpdateHook(next)
                }
            }

            const atom = atmover.construct(A, [val])
            atom.get()
            val.set({a: 2})
            atom.get()
            assert(onUpdateHook.calledOnce)
            assert(onUpdateHook.firstCall.calledWith(sinon.match.instanceOf(A)))
        })
    })
})
