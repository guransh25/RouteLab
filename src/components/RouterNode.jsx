/**
 * RouterNode.jsx — RouteLab 2.1
 *
 * Visual states:
 *   data.role              – 'source' | 'destination'
 *   data.onPath            – true when node is on the shortest path
 *   data.isCanvasSelected  – true when user clicked this node on the canvas
 *   data.isStepActive      – true when this router is active in Dijkstra step exploration
 */

import { Handle, Position } from '@xyflow/react'

function RouterNode({ data }) {
  const isSource           = data.role === 'source'
  const isDestination      = data.role === 'destination'
  const isOnPath           = data.onPath === true
  const isCanvasSelected   = data.isCanvasSelected === true
  const isStepActive       = data.isStepActive === true

  const labelStr = String(data.label ?? '')
  const isLong = labelStr.length > 2

  let nodeClass = 'router-node'
  if (isCanvasSelected) nodeClass += ' router-node--selected'
  if (isSource)         nodeClass += ' router-node--source'
  if (isDestination)    nodeClass += ' router-node--destination'
  if (isOnPath)         nodeClass += ' router-node--path'
  if (isStepActive)     nodeClass += ' router-node--step'
  if (isLong)           nodeClass += ' router-node--pill'

  return (
    <div className={nodeClass} title={labelStr}>
      {/* Invisible connection handles on all four sides */}
      <Handle type="target" position={Position.Top}    className="router-handle" />
      <Handle type="target" position={Position.Bottom} className="router-handle" />
      <Handle type="target" position={Position.Left}   className="router-handle" />
      <Handle type="target" position={Position.Right}  className="router-handle" />

      <span className={`router-node__label ${isLong ? 'router-node__label--long' : ''}`}>
        {labelStr}
      </span>

      {/* Role badges */}
      {isSource      && <span className="router-node__badge router-node__badge--src">SRC</span>}
      {isDestination && <span className="router-node__badge router-node__badge--dst">DST</span>}
      {isStepActive && !isSource && !isDestination && (
        <span className="router-node__badge router-node__badge--step">STEP</span>
      )}

      {/* Selected indicator ring */}
      {isCanvasSelected && (
        <span className="router-node__sel-ring" aria-hidden="true" />
      )}

      <Handle type="source" position={Position.Top}    className="router-handle" />
      <Handle type="source" position={Position.Bottom} className="router-handle" />
      <Handle type="source" position={Position.Left}   className="router-handle" />
      <Handle type="source" position={Position.Right}  className="router-handle" />
    </div>
  )
}

export default RouterNode
