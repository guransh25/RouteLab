/**
 * NetworkCanvas.jsx — RouteLab 2.1
 *
 * Interactive graph canvas powered by React Flow:
 *   - Nodes: Routers with dynamic role, path, selection, and step highlighting
 *   - Edges: Weighted connections with active-hop, shortest-path, and failure styles
 *   - Summary Strip: Lightweight status bar showing network name and resource counts
 *   - Selection Banner: Non-intrusive floating guide during Interactive Packet Mode
 *   - Empty State: Clean guidance for custom blank networks
 *   - MiniMap and Connection Legend
 */

import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ViewportPortal,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Network, MousePointerClick } from 'lucide-react'

// Styles applied to every edge by default.
const DEFAULT_EDGE_STYLE = {
  stroke: '#6b7280',
  strokeWidth: 2,
}

// Styles applied to the currently-selected edge.
const SELECTED_EDGE_STYLE = {
  stroke: '#2563eb',
  strokeWidth: 3,
}

// Styles applied to edges that belong to the shortest path.
const PATH_EDGE_STYLE = {
  stroke: '#16a34a',
  strokeWidth: 3,
}

// Styles applied to the currently transmitting hop during packet animation.
const ACTIVE_HOP_EDGE_STYLE = {
  stroke: '#f59e0b',
  strokeWidth: 4,
}

// Styles applied to disabled/inactive links.
// Dashed red stroke that overrides path and selection highlighting.
const DISABLED_EDGE_STYLE = {
  stroke: '#ef4444',
  strokeWidth: 2,
  strokeDasharray: '6 4',
}

function NetworkCanvas({
  nodes = [],
  edges = [],
  networkName = 'Network',
  selectedEdgeId,
  selectedNodeId,
  sourceId,
  destinationId,
  pathNodeSet,
  pathEdgeSet,
  packetCoords,
  activeHopEdgeId,
  activeStepNode,
  isCanvasSelecting = false,
  canvasSelectStep = 'source',
  onCancelCanvasSelect,
  onNodesChange,
  onEdgesChange,
  onNodeClick,
  onEdgeClick,
  onPaneClick,
  nodeTypes,
}) {
  /**
   * Enrich nodes with role and path flags so RouterNode can apply the right
   * visual state. Priority (highest to lowest):
   *   1. source / destination role  → filled blue / green
   *   2. isStepActive               → purple step ring & badge
   *   3. onPath                     → green ring
   *   4. isCanvasSelected           → blue dashed ring
   *   5. default                    → no extra class
   */
  const enrichedNodes = nodes.map((n) => {
    const isSource      = n.id === sourceId
    const isDestination = n.id === destinationId
    const isOnPath      = pathNodeSet ? pathNodeSet.has(n.id) : false
    const isSelected    = n.id === selectedNodeId
    const isStepActive  = n.id === activeStepNode

    return {
      ...n,
      data: {
        ...n.data,
        role:             isSource ? 'source' : isDestination ? 'destination' : undefined,
        onPath:           isOnPath,
        isCanvasSelected: isSelected,
        isStepActive,
      },
    }
  })

  /**
   * Enrich edges with the appropriate stroke style.
   * Priority: disabled (red dashed) > selected (blue) > on-path (green) > default (gray).
   */
  const enrichedEdges = edges.map((e) => {
    const isSelected = e.id === selectedEdgeId
    const isOnPath   = pathEdgeSet ? pathEdgeSet.has(e.id) : false
    const isDisabled = e.data?.enabled === false

    let edgeStyle    = DEFAULT_EDGE_STYLE
    let labelFill    = '#1f2937'
    let labelWeight  = 600
    let labelBg      = { fill: '#ffffff', fillOpacity: 0.9 }

    if (isOnPath) {
      edgeStyle   = PATH_EDGE_STYLE
      labelFill   = '#14532d'
      labelWeight = 700
      labelBg     = { fill: '#dcfce7', fillOpacity: 1 }
    }

    if (isSelected) {
      edgeStyle   = SELECTED_EDGE_STYLE
      labelFill   = '#1d4ed8'
      labelWeight = 700
      labelBg     = { fill: '#eff6ff', fillOpacity: 1 }
    }

    // Active hop during packet animation
    if (e.id === activeHopEdgeId && !isDisabled) {
      edgeStyle   = ACTIVE_HOP_EDGE_STYLE
      labelFill   = '#b45309'
      labelWeight = 700
      labelBg     = { fill: '#fef3c7', fillOpacity: 1 }
    }

    // Disabled status visually overrides selection and path highlighting
    if (isDisabled) {
      edgeStyle   = DISABLED_EDGE_STYLE
      labelFill   = '#dc2626'
      labelWeight = 700
      labelBg     = { fill: '#fee2e2', fillOpacity: 0.95 }
    }

    return {
      ...e,
      style: edgeStyle,
      labelStyle: {
        fill:       labelFill,
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize:   12,
        fontWeight: labelWeight,
      },
      labelBgStyle: labelBg,
    }
  })

  // Derived topology counts
  const activeLinkCount   = edges.filter((e) => e.data?.enabled !== false).length
  const disabledLinkCount = edges.filter((e) => e.data?.enabled === false).length

  return (
    <div className="canvas-wrapper">
      {/* Network Summary Strip (Phase D) */}
      <div className="canvas-summary-strip" role="status" aria-label="Network topology status summary">
        <span className="canvas-summary-strip__item">
          <span className="canvas-summary-strip__label">Network:</span>{' '}
          <strong className="canvas-summary-strip__val">{networkName}</strong>
        </span>
        <span className="canvas-summary-strip__divider" aria-hidden="true">•</span>
        <span className="canvas-summary-strip__item">
          <span className="canvas-summary-strip__label">Routers:</span>{' '}
          <strong className="canvas-summary-strip__val">{nodes.length}</strong>
        </span>
        <span className="canvas-summary-strip__divider" aria-hidden="true">•</span>
        <span className="canvas-summary-strip__item">
          <span className="canvas-summary-strip__label">Active Links:</span>{' '}
          <strong className="canvas-summary-strip__val">{activeLinkCount}</strong>
        </span>
        {disabledLinkCount > 0 && (
          <>
            <span className="canvas-summary-strip__divider" aria-hidden="true">•</span>
            <span className="canvas-summary-strip__item canvas-summary-strip__item--disabled">
              <span className="canvas-summary-strip__label">Disabled:</span>{' '}
              <strong className="canvas-summary-strip__val">{disabledLinkCount}</strong>
            </span>
          </>
        )}
      </div>

      {/* Interactive Packet Mode selection banner */}
      {isCanvasSelecting && (
        <div className="canvas-selection-banner" role="status" aria-live="polite">
          <MousePointerClick size={15} strokeWidth={2} className="canvas-selection-banner__icon" />
          <span className="canvas-selection-banner__text">
            {canvasSelectStep === 'source'
              ? 'Click a router to set SOURCE'
              : `Source set to [${sourceId}] — Click a router to set DESTINATION`}
          </span>
          <button
            type="button"
            className="btn btn--outline btn--sm canvas-selection-banner__cancel"
            onClick={onCancelCanvasSelect}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Empty network state */}
      {nodes.length === 0 && (
        <div className="canvas-empty-state">
          <div className="canvas-empty-state__icon-wrap">
            <Network size={36} strokeWidth={1.5} className="canvas-empty-state__icon" />
          </div>
          <h3 className="canvas-empty-state__title">Your network is empty</h3>
          <p className="canvas-empty-state__desc">
            Add a router from the left sidebar to get started.
          </p>
        </div>
      )}

      <ReactFlow
        nodes={enrichedNodes}
        edges={enrichedEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.16 }}
        minZoom={0.3}
        maxZoom={2.5}
        defaultEdgeOptions={{
          type: 'straight',
          style: DEFAULT_EDGE_STYLE,
          labelStyle: {
            fill: '#1f2937',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 12,
            fontWeight: 600,
          },
          labelBgStyle: { fill: '#ffffff', fillOpacity: 0.9 },
          labelBgPadding: [4, 6],
          labelBgBorderRadius: 4,
        }}
        proOptions={{ hideAttribution: false }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={22}
          size={1.2}
          color="#d1d5db"
        />
        <Controls showInteractive={false} />
        <MiniMap
          nodeStrokeWidth={2}
          nodeColor="#3b82f6"
          maskColor="rgba(241,245,249,0.6)"
          style={{
            width: 110,
            height: 75,
            border: '1px solid #e2e8f0',
            borderRadius: 6,
            background: '#ffffff',
          }}
        />

        {/* Animated packet marker rendered inside flow coordinates */}
        {packetCoords && (
          <ViewportPortal>
            <div
              className="packet-marker"
              style={{
                transform: `translate(${packetCoords.x - 10}px, ${packetCoords.y - 10}px)`,
              }}
              aria-label="Packet in transit"
            >
              <div className="packet-marker__core" />
              <div className="packet-marker__ring" />
            </div>
          </ViewportPortal>
        )}
      </ReactFlow>

      {/* Connection state legend */}
      <div className="canvas-legend" aria-label="Link status legend">
        <span className="canvas-legend__item">
          <span className="canvas-legend__line canvas-legend__line--normal" />
          Normal
        </span>
        <span className="canvas-legend__item">
          <span className="canvas-legend__line canvas-legend__line--path" />
          Shortest Path
        </span>
        <span className="canvas-legend__item">
          <span className="canvas-legend__line canvas-legend__line--active-hop" />
          Active Hop
        </span>
        <span className="canvas-legend__item">
          <span className="canvas-legend__line canvas-legend__line--disabled" />
          Disabled
        </span>
      </div>
    </div>
  )
}

export default NetworkCanvas
