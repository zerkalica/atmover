// @flow
/* eslint-env mocha */

import sinon from 'sinon'
import assert from 'power-assert'
import atomixers from './atomixers'
import {onUpdate} from '../interfaces'
import type {Rec} from './atomixers'

atomixers.forEach(([name, atomixer]: Rec) => {
    describe(`${name} computable`, () => {
        it('class', () => {
            type BOpts = {a: number}

            const a = atomixer.value(({a: 1}: BOpts))

            class B {
                _b: number
                constructor(opts: BOpts) {
                    this._b = opts.a
                }
            }

            const b = atomixer.construct(B, [a])
            assert(b.get()._b === 1)
            a.set({a: 2})
            assert(b.get()._b === 2)
        })

        it('factory', () => {
            type BOpts = {a: number}

            const a = atomixer.value(({a: 1}: BOpts))

            function bFactory(opts: BOpts) {
                return {_b: opts.a}
            }

            const b = atomixer.factory(bFactory, [a])
            assert(b.get()._b === 1)
            a.set({a: 2})
            assert(b.get()._b === 2)
        })

        it('class onUpdateHook on changing deps', () => {
            const onUpdateHook = sinon.spy()
            const val = atomixer.value({a: 1})
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

            const atom = atomixer.construct(A, [val])
            atom.get()
            val.set({a: 2})
            atom.get()
            assert(onUpdateHook.calledOnce)
            assert(onUpdateHook.firstCall.calledWith(sinon.match.instanceOf(A)))
        })
    })
})
