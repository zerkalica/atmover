// @flow
/* eslint-env mocha */

import assert from 'power-assert'
import atomizers from './atomizers'
import type {Rec} from './atomizers'

atomizers.forEach(([name, atomizer]: Rec) => {
    describe(`${name} computable`, () => {
        it('class', () => {
            type BOpts = {a: number}

            const a = atomizer.value(({a: 1}: BOpts))

            class B {
                _b: number
                constructor(opts: BOpts) {
                    this._b = opts.a
                }
            }

            const b = atomizer.constructComputed(B, [a])
            assert(b.get()._b === 1)
            assert.throws(() => b.setArgs([]))
            a.set({a: 2})
            assert(b.get()._b === 2)
        })

        it('factory', () => {
            type BOpts = {a: number}

            const a = atomizer.value(({a: 1}: BOpts))

            function bFactory(opts: BOpts) {
                return {_b: opts.a}
            }

            const b = atomizer.factoryComputed(bFactory, [a])
            assert(b.get()._b === 1)
            assert.throws(() => b.setArgs([]))
            a.set({a: 2})
            assert(b.get()._b === 2)
        })
    })
})
