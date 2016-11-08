# atmover

Atom overlay: abstraction layer on top of [mobx][mobx], [cellx][cellx], [derivable][derivable] with hot reload support and error handling.

Some limitations: Only object and functions as atom values: atmover attaches to them metadata. No observable collections, maps, etc.

[mobx]: https://github.com/mobxjs/mobx
[cellx]: https://github.com/Riim/cellx
[derivable]: https://github.com/ds300/derivablejs

<!-- TOC depthFrom:1 depthTo:6 withLinks:1 updateOnSave:1 orderedList:0 -->

- [atmover](#atmover)
	- [Setup](#setup)
		- [mobx](#mobx)
		- [derivable](#derivable)
		- [cellx:](#cellx)
	- [Value get/set](#value-getset)
	- [Get atom from object metadata](#get-atom-from-object-metadata)
	- [Transactions](#transactions)
	- [Computable class](#computable-class)
	- [Objects in constructor arguments](#objects-in-constructor-arguments)
	- [Computable function](#computable-function)
	- [Listen changes](#listen-changes)
	- [Error handling in computable](#error-handling-in-computable)
	- [onUpdate hook](#onupdate-hook)
	- [Replacing prototype](#replacing-prototype)

<!-- /TOC -->

## Setup

### mobx

```js
// @flow
import {onUpdate, Atmover, getAtom} from 'atmover'
import MobxPlugin from 'atmover/MobxPlugin'
import type {Atom} from 'atmover'
import * as mobx from 'mobx'

const hotReloadingEnabled = true
const atmover = new Atmover(new MobxPlugin(mobx), hotReloadingEnabled)
```

### derivable

```js
// @flow
import {Atmover, getAtom} from 'atmover'
import CellxPlugin from 'atmover/DerivablePlugin'
import type {Atom} from 'atmover'
import derivable from 'derivable'

const hotReloadingEnabled = true
const atmover = new Atmover(new DerivablePlugin(derivable), hotReloadingEnabled)
/// ...
```

### cellx:

```js
// @flow
import {Atmover, getAtom} from 'atmover'
import CellxPlugin from 'atmover/CellxPlugin'
import type {Atom} from 'atmover'
import cellx from 'cellx'

const hotReloadingEnabled = true
const atmover = new Atmover(new CellxPlugin(cellx), hotReloadingEnabled)
/// ...
```

## Value get/set

```js
// @flow

interface BOpts {
    a: number
}

const aAtom: Atom<BOpts> = atmover.value(({a: 1}: BOpts))
aAtom.get() // {a: 1}
aAtom.set({a: 2})
```

## Get atom from object metadata

```js
// @flow

const a = aAtom.get()
a.a === 1
const atom: Atom<BOpts> = getAtom(a)
```

## Transactions

```js
// @flow

const bAtom: Atom<BOpts> = atmover.value(({a: 10}: BOpts))

atmover.transact(() => {
    aAtom.set({a: 3})
    bAtom.set({a: 11})
})
```

## Computable class

```js
// @flow

class C {
    v: number

    constructor(opts1: BOpts, opts2: BOpts) {
        this.v = opts1.a + opts2.a
    }
}

const cAtom: Atom<C> = atmover.construct(C, [aAtom, bAtom])
const c: C = cAtom.get()
assert(c.v === 14)
```

## Objects in constructor arguments

```js
// @flow

class C {
    v: number

    constructor(opts1: BOpts, opts2: {b: BOpts}) {
        this.v = opts1.a + opts2.b.a
    }
}

const cAtom: Atom<C> = atmover.construct(C, [aAtom, {b: bAtom}])
const c: C = cAtom.get()
assert(c.v === 14)
```

## Computable function

```js
// @flow

interface CResult {
    v: number;
}

function factoryC(opts: BOpts): CResult {
    return {
        v: opts.a
    }
}

const fAtom: Atom<CResult> = atmover.factory(factoryC, [aAtom])
const f: CResult = fAtom.get()
assert(f.v === 3)
```

## Listen changes

```js
// @flow

const unsubscribe: () => void = cAtom.subscribe((c: C) => {
    console.log('c.v = ' + c.v)
})

aAtom.set({a: 4}) // console: c.v = 15

unsubscribe()
```

## Error handling in computable

```js
// @flow

class D {
    v: number

    constructor(opts1: BOpts, opts2: BOpts) {
        this.v = opts1.a + opts2.a
        if (this.v === 0) {
            throw new Error('Example error')
        }
    }
}

const dAtom: Atom<D> = atmover.construct(C, [aAtom, bAtom])

const unsubscribe: () => void = dAtom.subscribe((c: C) => {
    console.log('d.v = ' + d.v)
}, (err: Error) => {
    console.error(err)
})

atmover.transact(() => {
    aAtom.set({a: 0})
    bAtom.set({a: 0})
})
// console: Error: Example error

dAtom.get() === undefined

unsubscribe()
```

## onUpdate hook

```js
// @flow

class E {
    v: number
    some: number

    constructor(opts1: BOpts) {
        this.v = opts1.a
    }

    setSome(some: number): void {
        this.some = some
    }

    // $FlowFixMe: computed property key not supported, see https://github.com/facebook/flow/issues/2286
    [onUpdate](next: E) {
        next.setSome(this.some)
    }
}

const eAtom: Atom<E> = atmover.construct(E, [aAtom])

const oldValue: E = eAtom.get()

oldValue.setSome(33)

aAtom.set({a: 10})

const newValue: E = eAtom.get()

assert(oldValue !== newValue)
assert(newValue.some === 33)
```

## Replacing prototype

```js
// @flow
class B1 {
    v: number

    constructor(opts: BOpts) {
        this.v = opts.a
    }
}

class B2 extends B1 {
    v: number

    constructor(opts: BOpts) {
        super(opts)
        this.v = this.v * 2
    }
}
const b1Atom: Atom<B1> = atmover.construct(B1, [aAtom])
b1Atom.get().v === 10

// Hot reloading:
atmover.replaceProto(B1, B2)

b1Atom.get().v === 20
```
