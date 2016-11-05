// @flow

import derivable from 'derivable'
import * as mobx from 'mobx'
import DerivablePlugin from '../plugins/DerivablePlugin'
import MobxPlugin from '../plugins/MobxPlugin'
import type {Atomizer} from '../interfaces'
import BaseAtomizer from '../BaseAtomizer'

export type Rec = [string, Atomizer]

const atomizers: Rec[] = [
    ['derivable', new BaseAtomizer(new DerivablePlugin(derivable), true)],
    ['mobx', new BaseAtomizer(new MobxPlugin(mobx), true)]
]

export default atomizers
