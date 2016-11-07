# atmover

Atom overlay: abstraction layer on top of [mobx][mobx], [cellx][cellx], [derivable][derivable] with hot reload support.
On current moment supported only objects, get, set, subscribre, transact, replace prototype methods and onUpdate hook.

[mobx]: mobxjs.github.io/mobx/
[cellx]: https://github.com/Riim/cellx
[derivable]: https://github.com/ds300/derivablejs

## Example for mobx:

```js
// @flow
import {onUpdate, Atmover, getAtom} from 'atmover'
import MobxPlugin from 'atmover/MobxPlugin'
import type {Atom} from 'atmover'
import * as mobx from 'mobx'

const hotReloadingEnabled = true
const atmover = new Atmover(new MobxPlugin(mobx), hotReloadingEnabled)

interface BOpts {
    a: number
}

const aAtom: Atom<BOpts> = atmover.value(({a: 1}: BOpts))
const bAtom: Atom<BOpts> = atmover.value(({a: 20}: BOpts))

class B {
    v: number
    v2: number
    constructor(opts1: BOpts, opts2: BOpts) {
        this.v = opts1.a
        this.v2 = opts2.a
    }
}

const bAtom: Atom<B> = atmover.construct(B, [aAtom, bAtom])
const b: B = bAtom.get()
assert(b.v === 1)

const unsubscribe: () => void = b.subscribe((b: B) => {
    console.log('reinit B', b)
})

atmover.transact(() => {
    aAtom.set({a: 2}) // reinit B
    bAtom.set({a: 20})
})

// Get atom from object metadata:
assert(getAtom(b).get().v === 2)

class C extends B {
    v1: number
    constructor(opts: BOpts) {
        super(opts)
        this.v1 = opts.a + 1
    }

    // $FlowFixMe: computed property key not supported, see https://github.com/facebook/flow/issues/2286
    [onUpdate](next: C) {
        console.log('Before update hook')
    }
}

// Hot reloading:
atmover.replaceProto(B, C)
// console: Before update hook
// console: reinit B

assert(getAtom(b).get() instanceof C)
assert(getAtom(b).get().v1 === 3)

unsubscribe()
// ...
```

## Example for derivable:

```js
// @flow
import {Atmover, getAtom} from 'atmover'
import DerivablePlugin from 'atmover/DerivablePlugin'
import type {Atom} from 'atmover'
import derivable from 'derivable'

const hotReloadingEnabled = true
const atmover = new Atmover(new DerivablePlugin(derivable), hotReloadingEnabled)
/// ...
```

## Example for cellx:

```js
// @flow
import {Atmover, getAtom} from 'atmover'
import CellxPlugin from 'atmover/CellxPlugin'
import type {Atom} from 'atmover'
import cellx from 'cellx'

const hotReloadingEnabled = true
const atmover = new Atmover(new DerivablePlugin(cellx), hotReloadingEnabled)
/// ...
```
