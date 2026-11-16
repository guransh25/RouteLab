/**
 * Sidebar.jsx — RouteLab 2.1
 *
 * Professional Network Simulator Sidebar:
 *   1. Routing Controls — Algorithm switcher, Source/Destination selectors,
 *      Interactive "Select on Canvas" mode, Find Shortest Path, Send Packet & Reset.
 *   2. Network Editing — Add Router, Add Link, contextual Router properties
 *      (display label rename & delete), and contextual Link properties (metric edit, failure toggle, delete).
 *   3. Ergonomic Footer — Quick reference tips.
 */

import { useState, useEffect } from 'react'
import {
  PlusCircle,
  Link,
  Search,
  RotateCcw,
  Trash2,
  Check,
  Ban,
  CheckCircle,
  Send,
  MousePointerClick,
  Info,
} from 'lucide-react'

function Sidebar({
  nodes = [],
  edges = [],
  selectedNodeId,
  selectedEdge,
  sourceId,
  destinationId,
  currentPreset = 'basic',
  selectedAlgorithm = 'dijkstra',
  isCanvasSelecting = false,
  canvasSelectStep = 'source',
  onToggleCanvasSelect,
  onRenameRouter,
  onSelectAlgorithm,
  onSelectPreset,
  onSourceChange,
  onDestinationChange,
  onFindPath,
  onResetPath,
  onSendPacket,
  canSendPacket = false,
  isPacketInTransit = false,
  onAddRouter,
  onRemoveRouter,
  onAddLink,
  onUpdateEdgeCost,
  onRemoveEdge,
  onToggleLink,
}) {
  const nodeIds = nodes.map((n) => n.id)

  const getRouterDisplayLabel = (id) => {
    const n = nodes.find((node) => node.id === id)
    const label = n?.data?.label
    return label && label !== id ? `${label} (${id})` : id
  }

  // ── Add Link form state ───────────────────────────────────────────────────
  const [showLinkForm, setShowLinkForm]   = useState(false)
  const [linkFrom,     setLinkFrom]       = useState('')
  const [linkTo,       setLinkTo]         = useState('')
  const [linkCost,     setLinkCost]       = useState('')
  const [linkError,    setLinkError]      = useState('')

  const toggleLinkForm = () => {
    setShowLinkForm((v) => !v)
    setLinkFrom('')
    setLinkTo('')
    setLinkCost('')
    setLinkError('')
  }

  const handleLinkSubmit = () => {
    const err = onAddLink(linkFrom, linkTo, linkCost)
    if (err) {
      setLinkError(err)
    } else {
      setShowLinkForm(false)
      setLinkFrom('')
      setLinkTo('')
      setLinkCost('')
      setLinkError('')
    }
  }

  // ── Edge cost edit state ──────────────────────────────────────────────────
  const [editCost,  setEditCost]  = useState('')
  const [costError, setCostError] = useState('')

  useEffect(() => {
    setEditCost('')
    setCostError('')
  }, [selectedEdge?.id])

  const handleCostSave = () => {
    const err = onUpdateEdgeCost(editCost)
    if (err) {
      setCostError(err)
    } else {
      setCostError('')
      setEditCost('')
    }
  }

  // ── Router Rename state ──────────────────────────────────────────────────
  const [editLabel,   setEditLabel]   = useState('')
  const [renameError, setRenameError] = useState('')

  const selectedNode = nodes.find((n) => n.id === selectedNodeId)
  const currentNodeLabel = selectedNode?.data?.label ?? selectedNodeId ?? ''

  useEffect(() => {
    setEditLabel(selectedNode?.data?.label ?? selectedNodeId ?? '')
    setRenameError('')
  }, [selectedNodeId, selectedNode?.data?.label])

  const handleRenameSubmit = () => {
    const trimmed = editLabel.trim()
    if (!trimmed) {
      setRenameError('Display label cannot be empty.')
      return
    }
    const err = onRenameRouter?.(selectedNodeId, trimmed)
    if (err) {
      setRenameError(err)
    } else {
      setRenameError('')
    }
  }

  // ── Confirm-delete guard for the router ──────────────────────────────────
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    setConfirmDelete(false)
  }, [selectedNodeId])

  const handleDeleteRouterClick = () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
    } else {
      onRemoveRouter()
      setConfirmDelete(false)
    }
  }

  // Button title messages explaining disabled states
  const findPathTitle = !sourceId || !destinationId
    ? 'Select both Source and Destination to calculate shortest path'
    : sourceId === destinationId
    ? 'Source and Destination must be distinct routers'
    : 'Calculate optimal path using selected algorithm'

  const sendPacketTitle = !canSendPacket
    ? 'Calculate a valid shortest path first'
    : isPacketInTransit
    ? 'Packet transmission currently in progress'
    : 'Transmit simulated data packet along calculated route'

  return (
    <aside className="sidebar" aria-label="Simulator Controls Sidebar">

      {/* ═══════════════════════════════════════════════════════
          1. Routing Controls (Primary Workflow)
          ═══════════════════════════════════════════════════════ */}
      <section className="sidebar__section" aria-labelledby="heading-routing-controls">
        <h2 id="heading-routing-controls" className="sidebar__section-title">Routing Controls</h2>

        {/* Algorithm selector */}
        <div className="sidebar__field">
          <label className="sidebar__label" htmlFor="algo-select">Routing Algorithm</label>
          <select
            id="algo-select"
            className="sidebar__select"
            value={selectedAlgorithm}
            onChange={(e) => onSelectAlgorithm && onSelectAlgorithm(e.target.value)}
          >
            <option value="dijkstra">Dijkstra&apos;s (Link-State / OSPF)</option>
            <option value="bellman-ford">Bellman-Ford (Distance-Vector / RIP)</option>
          </select>
        </div>

        {/* Source & Destination in a compact 2-column row */}
        <div className="sidebar__endpoints-row">
          <div className="sidebar__field sidebar__field--half">
            <label className="sidebar__label" htmlFor="source-select">Source</label>
            <select
              id="source-select"
              className="sidebar__select"
              value={sourceId ?? ''}
              onChange={(e) => onSourceChange(e.target.value || null)}
            >
              <option value="">— select —</option>
              {nodeIds.map((id) => (
                <option key={id} value={id}>{getRouterDisplayLabel(id)}</option>
              ))}
            </select>
          </div>

          <div className="sidebar__field sidebar__field--half">
            <label className="sidebar__label" htmlFor="dest-select">Destination</label>
            <select
              id="dest-select"
              className="sidebar__select"
              value={destinationId ?? ''}
              onChange={(e) => onDestinationChange(e.target.value || null)}
            >
              <option value="">— select —</option>
              {nodeIds.map((id) => (
                <option key={id} value={id}>{getRouterDisplayLabel(id)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Interactive Packet Mode (Select on Canvas) */}
        <div className="sidebar__canvas-select-row">
          <button
            type="button"
            className={`btn btn--sm sidebar__canvas-select-btn ${isCanvasSelecting ? 'btn--primary' : 'btn--outline'}`}
            onClick={onToggleCanvasSelect}
            title={nodeIds.length < 2 ? 'Add at least 2 routers first' : 'Click routers on canvas to set Source and Destination'}
            disabled={nodeIds.length < 2}
          >
            <MousePointerClick size={14} strokeWidth={1.8} />
            {isCanvasSelecting ? 'Cancel Canvas Selection' : 'Select on Canvas'}
          </button>
        </div>

        {isCanvasSelecting && (
          <div className="sidebar__selection-guide" role="status" aria-live="polite">
            <span className="sidebar__selection-guide-dot" aria-hidden="true" />
            <span className="sidebar__selection-guide-text">
              {canvasSelectStep === 'source'
                ? 'Step 1: Click router on canvas for Source'
                : `Step 2: Source is [${sourceId}] → Click Destination`}
            </span>
          </div>
        )}

        {/* Primary Action Button: Find Shortest Path */}
        <button
          className="btn btn--primary sidebar__full-btn"
          onClick={onFindPath}
          disabled={!sourceId || !destinationId || sourceId === destinationId}
          title={findPathTitle}
        >
          <Search size={15} strokeWidth={2} />
          Find Shortest Path
        </button>

        {/* Secondary Workflow: Send Packet & Reset */}
        <div className="sidebar__action-row">
          <button
            className="btn btn--accent sidebar__action-btn"
            onClick={onSendPacket}
            disabled={!canSendPacket || isPacketInTransit}
            title={sendPacketTitle}
          >
            <Send size={14} strokeWidth={2} />
            {isPacketInTransit ? 'In Transit...' : 'Send Packet'}
          </button>

          <button
            className="btn btn--outline sidebar__action-btn--reset"
            onClick={onResetPath}
            title="Clear active route calculation"
          >
            <RotateCcw size={14} strokeWidth={1.8} />
            Reset
          </button>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          2. Network Editing
          ═══════════════════════════════════════════════════════ */}
      <section className="sidebar__section" aria-labelledby="heading-network-editing">
        <h2 id="heading-network-editing" className="sidebar__section-title">Network Editing</h2>

        <div className="sidebar__edit-btn-row">
          <button
            className="btn btn--outline btn--sm sidebar__edit-btn"
            onClick={onAddRouter}
            title="Add a new router node to the network"
          >
            <PlusCircle size={14} strokeWidth={1.8} />
            Add Router
          </button>

          <button
            className={`btn btn--outline btn--sm sidebar__edit-btn ${showLinkForm ? 'btn--outline--active' : ''}`}
            onClick={toggleLinkForm}
            title="Connect two routers with a weighted link"
          >
            <Link size={14} strokeWidth={1.8} />
            {showLinkForm ? 'Cancel' : 'Add Link'}
          </button>
        </div>

        {/* Inline Add Link Form */}
        {showLinkForm && (
          <div className="inline-form" role="region" aria-label="Add weighted link form">
            <div className="inline-form__row">
              <div className="sidebar__field sidebar__field--half">
                <label className="sidebar__label">From</label>
                <select
                  className="sidebar__select"
                  value={linkFrom}
                  onChange={(e) => { setLinkFrom(e.target.value); setLinkError('') }}
                  aria-label="From Router"
                >
                  <option value="">—</option>
                  {nodeIds.map((id) => (
                    <option key={id} value={id}>{getRouterDisplayLabel(id)}</option>
                  ))}
                </select>
              </div>

              <div className="sidebar__field sidebar__field--half">
                <label className="sidebar__label">To</label>
                <select
                  className="sidebar__select"
                  value={linkTo}
                  onChange={(e) => { setLinkTo(e.target.value); setLinkError('') }}
                  aria-label="To Router"
                >
                  <option value="">—</option>
                  {nodeIds.map((id) => (
                    <option key={id} value={id}>{getRouterDisplayLabel(id)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="sidebar__field">
              <label className="sidebar__label">Cost / Metric</label>
              <input
                type="number"
                className="sidebar__input"
                placeholder="e.g. 5"
                min="1"
                value={linkCost}
                onChange={(e) => { setLinkCost(e.target.value); setLinkError('') }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleLinkSubmit()
                  if (e.key === 'Escape') toggleLinkForm()
                }}
                aria-label="Link Cost Metric"
              />
            </div>

            {linkError && (
              <p className="inline-form__error" role="alert">{linkError}</p>
            )}

            <button
              className="btn btn--primary sidebar__full-btn btn--sm"
              onClick={handleLinkSubmit}
              disabled={!linkFrom || !linkTo || !linkCost}
            >
              <Check size={14} strokeWidth={2} />
              Save Link
            </button>
          </div>
        )}

        {/* Contextual: Selected Router panel */}
        {selectedNodeId && (
          <div className="props-panel" style={{ marginTop: 8 }} role="region" aria-label="Selected router properties">
            <p className="props-panel__label">
              Router <strong>{currentNodeLabel}</strong>
              {currentNodeLabel !== selectedNodeId && (
                <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500, marginLeft: 4 }}>
                  (ID: {selectedNodeId})
                </span>
              )}
            </p>
            <p className="props-panel__hint">
              {edges.filter(
                (e) => e.source === selectedNodeId || e.target === selectedNodeId
              ).length} connected link(s)
            </p>

            {/* Rename Router Form */}
            <div className="sidebar__field" style={{ marginTop: 8, marginBottom: 8 }}>
              <label className="sidebar__label" htmlFor="rename-router-input">
                Display Label
              </label>
              <div className="inline-row">
                <input
                  id="rename-router-input"
                  type="text"
                  className="sidebar__input sidebar__input--flex"
                  value={editLabel}
                  onChange={(e) => { setEditLabel(e.target.value); setRenameError('') }}
                  placeholder="e.g. Gateway"
                  maxLength={24}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRenameSubmit()
                    if (e.key === 'Escape') setEditLabel(currentNodeLabel)
                  }}
                />
                <button
                  type="button"
                  className="btn btn--outline btn--sm"
                  onClick={handleRenameSubmit}
                  disabled={!editLabel.trim() || editLabel.trim() === currentNodeLabel}
                  title="Update router display name"
                >
                  Rename
                </button>
              </div>
              {renameError && <p className="inline-form__error" role="alert">{renameError}</p>}
            </div>

            {!confirmDelete ? (
              <button
                className="btn btn--danger sidebar__full-btn btn--sm"
                onClick={handleDeleteRouterClick}
                title={`Delete router ${currentNodeLabel}`}
              >
                <Trash2 size={13} strokeWidth={1.8} />
                Delete Router
              </button>
            ) : (
              <div className="confirm-row">
                <span className="confirm-row__text">Delete {currentNodeLabel}?</span>
                <button
                  className="btn btn--danger btn--sm"
                  onClick={handleDeleteRouterClick}
                >
                  Yes
                </button>
                <button
                  className="btn btn--outline btn--sm"
                  onClick={() => setConfirmDelete(false)}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}

        {/* Contextual: Selected Link panel */}
        {selectedEdge && (
          <div className="props-panel" style={{ marginTop: 8 }} role="region" aria-label="Selected link properties">
            <p className="props-panel__label">
              Link <strong>{selectedEdge.source} — {selectedEdge.target}</strong>
            </p>
            <p className="props-panel__hint">
              Metric: <strong>{selectedEdge.data?.cost}</strong>
              &nbsp;&bull;&nbsp;
              Status: <strong style={{ color: selectedEdge.data?.enabled === false ? '#dc2626' : '#16a34a' }}>
                {selectedEdge.data?.enabled === false ? 'Disabled' : 'Active'}
              </strong>
            </p>

            <div className="inline-row" style={{ marginTop: 6 }}>
              <input
                key={selectedEdge.id}
                type="number"
                className="sidebar__input sidebar__input--flex"
                placeholder={String(selectedEdge.data?.cost ?? '')}
                min="1"
                value={editCost}
                onChange={(e) => { setEditCost(e.target.value); setCostError('') }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCostSave()
                  if (e.key === 'Escape') { setEditCost(''); setCostError('') }
                }}
                aria-label="Edit link cost"
              />
              <button
                className="btn btn--primary btn--sm"
                onClick={handleCostSave}
                disabled={!editCost}
                title="Save updated link cost"
              >
                Save
              </button>
            </div>

            {costError && <p className="inline-form__error" role="alert">{costError}</p>}

            <div className="sidebar__edit-btn-row" style={{ marginTop: 6 }}>
              <button
                className={`btn btn--sm sidebar__edit-btn ${
                  selectedEdge.data?.enabled === false
                    ? 'btn--secondary'
                    : 'btn--outline'
                }`}
                onClick={onToggleLink}
                title={selectedEdge.data?.enabled === false ? 'Restore link connection' : 'Simulate physical link failure'}
              >
                {selectedEdge.data?.enabled === false ? (
                  <>
                    <CheckCircle size={13} strokeWidth={1.8} />
                    Enable
                  </>
                ) : (
                  <>
                    <Ban size={13} strokeWidth={1.8} />
                    Disable
                  </>
                )}
              </button>

              <button
                className="btn btn--danger btn--sm sidebar__edit-btn"
                onClick={onRemoveEdge}
                title="Permanently remove this link"
              >
                <Trash2 size={13} strokeWidth={1.8} />
                Delete
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════
          3. Quick Tip Footer
          ═══════════════════════════════════════════════════════ */}
      <div className="sidebar__footer-tip">
        <p className="sidebar__tip-text">
          Drag routers to reposition. Click any router or link to edit properties.
        </p>
      </div>

    </aside>
  )
}

export default Sidebar
