// @flow

import derivable from 'derivable'
import * as mobx from 'mobx'
import DerivableAtomizer from '../plugins/DerivableAtomizer'
import MobxAtomizer from '../plugins/MobxAtomizer'
import type {Atomizer} from '../interfaces'

export type Rec = [string, Atomizer]

const atomizers: Rec[] = [
    ['derivable', DerivableAtomizer(derivable, true)],
    ['mobx', MobxAtomizer(mobx, true)]
]

export default atomizers
