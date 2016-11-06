# atomixer

Abstraction layer on top of mobx, cellx, derivable with hot reload support.

```js
// @flow
import {Atomixer, MobxPlugin, getAtom} from 'atomixer'
import type {Atom} from 'atomixer'
import * as mobx from 'mobx'

const hotReloadingEnabled = true
const atomixer = new Atomixer(new MobxPlugin(mobx), hotReloadingEnabled)

interface BOpts {
    a: number
}

const a = atomixer.value(({a: 1}: BOpts)).get()

class B {
    v: number
    constructor(opts: BOpts) {
        this.v = opts.a
    }
}

const b: B = atomixer.construct(B, [a]).get()

assert(b.v === 1)

const dispose: () => void = getAtom(b).subscribe((b: B) => {
    console.log('reinit B', b)
})

getAtom(a).set({a: 2}) // reinit B

assert(getAtom(b).get().v === 2)

class C extends B {
    v1: number
    constructor(opts: BOpts) {
        super(opts)
        this.v1 = opts.a + 1
    }
}

atomixer.replaceProto(B, C) // reinit B

assert(getAtom(b).get() instanceof C)
assert(getAtom(b).get().v1 === 3)

// ...

```
