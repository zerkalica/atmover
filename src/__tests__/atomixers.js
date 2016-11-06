// @flow

import derivable from 'derivable'
import * as mobx from 'mobx'
import cellx from 'cellx'
import DerivablePlugin from '../plugins/DerivablePlugin'
import MobxPlugin from '../plugins/MobxPlugin'
import CellxPlugin from '../plugins/CellxPlugin'
import Atomixer from '../Atomixer'

export type Rec = [string, Atomixer]

const atomixers: Rec[] = [
    ['derivable', new Atomixer(new DerivablePlugin(derivable), true)],
    ['mobx', new Atomixer(new MobxPlugin(mobx), true)],
    ['cellx', new Atomixer(new CellxPlugin(cellx), true)]
]

export default atomixers
