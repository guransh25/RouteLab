/**
 * initialNetwork.js
 * Exports default 5-router network topology for backward compatibility.
 * Sourced from the 'basic' preset in networkPresets.js.
 */

import { PRESETS } from './networkPresets.js'

export const initialNodes = PRESETS.basic.nodes
export const initialEdges = PRESETS.basic.edges
export { PRESETS }

