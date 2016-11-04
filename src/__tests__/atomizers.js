// @flow

import derivable from 'derivable'
import DerivableAtomizer from '../plugins/DerivableAtomizer'
import type {Atomizer} from '../interfaces'

export type Rec = [string, Atomizer]

const atomizers: Rec[] = [
    ['derivable', new DerivableAtomizer(derivable, true)]
]

export default atomizers
