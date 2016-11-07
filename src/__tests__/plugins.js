// @flow

import derivable from 'derivable'
import * as mobx from 'mobx'
import cellx from 'cellx'
import DerivablePlugin from '../plugins/DerivablePlugin'
import MobxPlugin from '../plugins/MobxPlugin'
import CellxPlugin from '../plugins/CellxPlugin'
import Atmover from '../Atmover'

export type Rec = [string, Atmover]

const plugins: Rec[] = [
    ['derivable', new Atmover(new DerivablePlugin(derivable), true)],
    ['mobx', new Atmover(new MobxPlugin(mobx), true)],
    ['cellx', new Atmover(new CellxPlugin(cellx), true)]
]

export default plugins
