/**
 * ResultsPanel.jsx — RouteLab 2.1
 *
 * Professional Tabbed Workspace for Network Analysis:
 *   1. Overview Tab — Shortest path result, packet delivery progress, and dynamic routing table
 *   2. Algorithm Steps Tab — Step-by-step Dijkstra execution trace with tentative distance vector
 *   3. Compare Algorithms Tab — Side-by-side complexity and design matrix for Dijkstra vs Bellman-Ford
 *   4. Event Log Tab — Structured table format with timestamp, status indicators, and clear action
 */

import { useState } from 'react'
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  GitCompare,
  ScrollText,
  RotateCcw,
  Layers,
  ArrowRight,
  Info,
} from 'lucide-react'

function ResultsPanel({
  pathResult,
  routingTable = [],
  sourceId,
  destinationId,
  lastAction,
  packetState = { status: 'idle', currentHop: 0, totalHops: 0, message: '' },
  selectedAlgorithm = 'dijkstra',
  comparisonData = {},
  activeStepIndex = 0,
  onStepChange,
  onResetSteps,
  allNodeIds = [],
  eventLog = [],
  onClearEventLog,
}) {
  // Tab state: 'overview' | 'steps' | 'compare' | 'log'
  const [activeTab, setActiveTab] = useState('overview')

  /* Derive display booleans */
  const hasResult     = pathResult != null && pathResult.path.length > 0
  const isUnreachable = pathResult != null && pathResult.path.length === 0

  const steps = pathResult?.steps ?? []
  const currentStep = steps[activeStepIndex] ?? steps[0] ?? null

  const algoLabel = selectedAlgorithm === 'bellman-ford' ? 'Bellman-Ford' : "Dijkstra's"

  /**
   * Format a routing-table row's cells.
   * Returns { nextHop, costStr, pathStr } ready for display.
   */
  function formatRow(row) {
    if (row.destination === sourceId) {
      return { nextHop: '—', costStr: '0', pathStr: row.destination }
    }
    if (!Number.isFinite(row.cost) || row.cost === Infinity) {
      return { nextHop: '—', costStr: '∞', pathStr: 'Unreachable' }
    }
    return {
      nextHop: row.nextHop ?? '—',
      costStr: String(row.cost),
      pathStr: Array.isArray(row.path) ? row.path.join(' → ') : '—',
    }
  }

  return (
    <section className="results-panel" aria-label="Results and Analysis Workspace">

      {/* ── Tabbed Navigation Bar (Phase C) ────────────────────── */}
      <div className="results-tabs-bar">
        <div className="results-tabs" role="tablist" aria-label="Analysis Tabs">
          <button
            role="tab"
            id="tab-overview"
            aria-selected={activeTab === 'overview'}
            aria-controls="panel-overview"
            className={`results-tab-btn ${activeTab === 'overview' ? 'results-tab-btn--active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <Layers size={13} strokeWidth={2} />
            <span>Overview</span>
          </button>

          <button
            role="tab"
            id="tab-steps"
            aria-selected={activeTab === 'steps'}
            aria-controls="panel-steps"
            className={`results-tab-btn ${activeTab === 'steps' ? 'results-tab-btn--active' : ''}`}
            onClick={() => setActiveTab('steps')}
          >
            <HelpCircle size={13} strokeWidth={2} />
            <span>Algorithm Steps</span>
            {steps.length > 0 && selectedAlgorithm === 'dijkstra' && (
              <span className="results-tab-btn__badge">{steps.length}</span>
            )}
          </button>

          <button
            role="tab"
            id="tab-compare"
            aria-selected={activeTab === 'compare'}
            aria-controls="panel-compare"
            className={`results-tab-btn ${activeTab === 'compare' ? 'results-tab-btn--active' : ''}`}
            onClick={() => setActiveTab('compare')}
          >
            <GitCompare size={13} strokeWidth={2} />
            <span>Compare Algorithms</span>
          </button>

          <button
            role="tab"
            id="tab-log"
            aria-selected={activeTab === 'log'}
            aria-controls="panel-log"
            className={`results-tab-btn ${activeTab === 'log' ? 'results-tab-btn--active' : ''}`}
            onClick={() => setActiveTab('log')}
          >
            <ScrollText size={13} strokeWidth={2} />
            <span>Event Log</span>
            {eventLog.length > 0 && (
              <span className="results-tab-btn__badge">{eventLog.length}</span>
            )}
          </button>
        </div>

        {/* Informational algorithm indicator */}
        <div className="results-tabs-bar__algo-tag" title="Currently active routing algorithm engine">
          <span className="results-tabs-bar__algo-label">Engine:</span>{' '}
          <strong>{algoLabel}</strong>
        </div>
      </div>

      {/* ── TAB 1: OVERVIEW ────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div
          className="overview-tab"
          role="tabpanel"
          id="panel-overview"
          aria-labelledby="tab-overview"
          tabIndex={0}
        >
          <div className="results-panel__main">

            {/* 1. Shortest Path Result Block */}
            <div className="results-panel__block results-panel__block--route">
              <h2 className="results-panel__heading">Shortest Path Result</h2>

              {lastAction && (
                <p className="results-panel__notice" role="status">
                  {lastAction}
                </p>
              )}

              {!pathResult && (
                <p className="results-panel__placeholder">
                  Select a source and destination, then click{' '}
                  <strong>Find Shortest Path</strong> (or use Select on Canvas).
                </p>
              )}

              {isUnreachable && (
                <p className="results-panel__status results-panel__status--error" role="alert">
                  No route available — destination is not reachable from source.
                </p>
              )}

              {hasResult && (
                <div className="results-panel__result">
                  <div className="results-panel__path-container" title={`Optimal path: ${pathResult.path.join(' → ')}`}>
                    <span className="results-panel__path">
                      {pathResult.path.join(' → ')}
                    </span>
                  </div>
                  <div className="results-panel__meta-row">
                    <span className="results-panel__cost">
                      Total cost:&nbsp;<strong>{pathResult.cost}</strong>
                    </span>
                    <span className="results-panel__algo">
                      Algorithm: {algoLabel}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Packet Delivery Status Block */}
            <div className="results-panel__block results-panel__block--packet">
              <h2 className="results-panel__heading">Packet Delivery Status</h2>

              <div className="packet-status-card">
                <div className="packet-status-card__header">
                  {packetState.status === 'in_transit' && (
                    <span className="packet-badge packet-badge--transit">
                      <Clock size={12} strokeWidth={2} />
                      In Transit
                    </span>
                  )}
                  {packetState.status === 'delivered' && (
                    <span className="packet-badge packet-badge--delivered">
                      <CheckCircle2 size={12} strokeWidth={2} />
                      Delivered
                    </span>
                  )}
                  {packetState.status === 'failed' && (
                    <span className="packet-badge packet-badge--failed">
                      <AlertCircle size={12} strokeWidth={2} />
                      Transmission Halted
                    </span>
                  )}
                  {packetState.status === 'idle' && (
                    <span className="packet-badge packet-badge--idle">
                      Ready
                    </span>
                  )}
                </div>

                <p className="packet-status-card__message">
                  {packetState.message || 'Select source and destination, calculate route, then click Send Packet.'}
                </p>

                {packetState.totalHops > 0 && (
                  <div className="packet-status-card__hop-container">
                    <div className="packet-status-card__hop-info">
                      <span className="packet-status-card__hop-text">
                        Hop {Math.min(packetState.currentHop, packetState.totalHops)} of {packetState.totalHops}
                      </span>
                      <span className="packet-status-card__hop-pct">
                        {Math.round((Math.min(packetState.currentHop, packetState.totalHops) / packetState.totalHops) * 100)}%
                      </span>
                    </div>
                    <div
                      className="hop-progress-bar"
                      role="progressbar"
                      aria-valuenow={packetState.currentHop}
                      aria-valuemin={0}
                      aria-valuemax={packetState.totalHops}
                      aria-label="Packet transmission progress"
                    >
                      <div
                        className="hop-progress-bar__fill"
                        style={{
                          width: `${(Math.min(packetState.currentHop, packetState.totalHops) / packetState.totalHops) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 3. Routing Table Block */}
            <div className="results-panel__block results-panel__block--table">
              <h2 className="results-panel__heading">
                Routing Table
                {sourceId ? ` — Source: ${sourceId} (${algoLabel})` : ''}
              </h2>

              {!sourceId ? (
                <p className="results-panel__placeholder">
                  Select a source router to view its routing table.
                </p>
              ) : (
                <div className="routing-table-container">
                  <table className="routing-table" aria-label={`Routing table for router ${sourceId}`}>
                    <thead>
                      <tr>
                        <th scope="col">Destination</th>
                        <th scope="col">Next Hop</th>
                        <th scope="col">Cost</th>
                        <th scope="col">Path Sequence</th>
                      </tr>
                    </thead>
                    <tbody>
                      {routingTable.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="routing-table__placeholder">
                            No routers in the network.
                          </td>
                        </tr>
                      ) : (
                        routingTable.map((row) => {
                          const { nextHop, costStr, pathStr } = formatRow(row)
                          const isActive = row.destination === destinationId

                          return (
                            <tr
                              key={row.destination}
                              className={isActive ? 'routing-table__row--active' : ''}
                            >
                              <td><strong>{row.destination}</strong></td>
                              <td>{nextHop}</td>
                              <td>{costStr}</td>
                              <td className="routing-table__path-cell" title={pathStr}>
                                {pathStr}
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ── TAB 2: ALGORITHM STEPS ─────────────────────────────── */}
      {activeTab === 'steps' && (
        <div
          className="algo-steps-panel"
          role="tabpanel"
          id="panel-steps"
          aria-labelledby="tab-steps"
          tabIndex={0}
        >
          <div className="algo-steps-panel__header">
            <h3 className="algo-steps-panel__title">Dijkstra Algorithm Step Explorer</h3>
            {selectedAlgorithm === 'dijkstra' && steps.length > 0 && (
              <span className="algo-steps-panel__progress">
                Viewing Step {activeStepIndex} of {Math.max(0, steps.length - 1)}
              </span>
            )}
          </div>

          {selectedAlgorithm !== 'dijkstra' ? (
            <p className="algo-steps__notice">
              Algorithm step explorer is currently available for Dijkstra&apos;s algorithm.
              Switch the Routing Algorithm in the sidebar to Dijkstra to trace step-by-step settlements.
            </p>
          ) : !steps || steps.length === 0 ? (
            <p className="algo-steps__notice">
              Select a source and destination, then click <strong>Find Shortest Path</strong> to record algorithm steps.
            </p>
          ) : (
            <div className="algo-steps__content">
              <div className="algo-steps__controls">
                <span className="algo-steps__step-label">
                  Step {activeStepIndex}:{' '}
                  <strong>
                    {currentStep.currentNode === 'Init'
                      ? 'Initialization'
                      : currentStep.currentNode
                      ? `Visiting Router ${currentStep.currentNode}`
                      : 'Complete'}
                  </strong>
                </span>
                <div className="algo-steps__btn-group">
                  <button
                    className="btn btn--outline btn--sm"
                    onClick={() => onStepChange && onStepChange(Math.max(0, activeStepIndex - 1))}
                    disabled={activeStepIndex <= 0}
                    title="View previous algorithm step"
                  >
                    ← Previous
                  </button>
                  <button
                    className="btn btn--outline btn--sm"
                    onClick={() => onStepChange && onStepChange(Math.min(steps.length - 1, activeStepIndex + 1))}
                    disabled={activeStepIndex >= steps.length - 1}
                    title="View next algorithm step"
                  >
                    Next →
                  </button>
                  <button
                    className="btn btn--outline btn--sm"
                    onClick={onResetSteps}
                    title="Reset step viewer to step 0"
                  >
                    <RotateCcw size={12} strokeWidth={1.8} />
                    Reset Steps
                  </button>
                </div>
              </div>

              <p className="algo-steps__desc">{currentStep.description}</p>

              {/* Tentative Distances Table */}
              <div className="algo-steps__table-wrap">
                <table className="algo-steps__table" aria-label="Tentative distances snapshot">
                  <thead>
                    <tr>
                      <th scope="col">Metric \ Router</th>
                      {allNodeIds.map((id) => (
                        <th
                          key={id}
                          scope="col"
                          className={currentStep.currentNode === id ? 'algo-steps__th--active' : ''}
                        >
                          {id}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th scope="row">Tentative Distance</th>
                      {allNodeIds.map((id) => {
                        const d = currentStep.distances?.[id]
                        return (
                          <td
                            key={id}
                            className={currentStep.currentNode === id ? 'algo-steps__td--active' : ''}
                          >
                            {d === undefined ? '—' : d === Infinity ? '∞' : d}
                          </td>
                        )
                      })}
                    </tr>
                    <tr>
                      <th scope="row">Predecessor</th>
                      {allNodeIds.map((id) => {
                        const p = currentStep.predecessors?.[id]
                        return (
                          <td
                            key={id}
                            className={currentStep.currentNode === id ? 'algo-steps__td--active' : ''}
                          >
                            {p ?? '—'}
                          </td>
                        )
                      })}
                    </tr>
                    <tr>
                      <th scope="row">Status</th>
                      {allNodeIds.map((id) => {
                        const isVisited = currentStep.visitedNodes?.includes(id)
                        return (
                          <td
                            key={id}
                            className={isVisited ? 'algo-steps__td--visited' : ''}
                          >
                            {isVisited ? 'Settled' : 'Unvisited'}
                          </td>
                        )
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: COMPARE ALGORITHMS ──────────────────────────── */}
      {activeTab === 'compare' && (
        <div
          className="algo-comparison-panel"
          role="tabpanel"
          id="panel-compare"
          aria-labelledby="tab-compare"
          tabIndex={0}
        >
          <div className="algo-comparison-panel__header">
            <h3 className="algo-comparison-panel__title">Routing Algorithm Comparison</h3>
            <span className="algo-comparison-panel__subtitle">Dijkstra vs Bellman-Ford on Active Topology</span>
          </div>

          <table className="algo-comparison__table" aria-label="Algorithm comparison matrix">
            <thead>
              <tr>
                <th scope="col">Algorithm</th>
                <th scope="col">Calculated Cost</th>
                <th scope="col">Time Complexity</th>
                <th scope="col">Protocol Context</th>
                <th scope="col">Design Principle</th>
              </tr>
            </thead>
            <tbody>
              <tr className={selectedAlgorithm === 'dijkstra' ? 'algo-comparison__row--active' : ''}>
                <td>
                  <strong>Dijkstra&apos;s</strong>
                  {selectedAlgorithm === 'dijkstra' && <span className="algo-active-tag">Active</span>}
                </td>
                <td>
                  <strong>
                    {comparisonData?.dijkstraCost !== undefined
                      ? (comparisonData.dijkstraCost === Infinity ? '∞' : comparisonData.dijkstraCost)
                      : '—'}
                  </strong>
                </td>
                <td><code>O(|V|² + |E|)</code></td>
                <td>Link-State (e.g., OSPF)</td>
                <td>Greedy search settling smallest tentative distance node</td>
              </tr>
              <tr className={selectedAlgorithm === 'bellman-ford' ? 'algo-comparison__row--active' : ''}>
                <td>
                  <strong>Bellman-Ford</strong>
                  {selectedAlgorithm === 'bellman-ford' && <span className="algo-active-tag">Active</span>}
                </td>
                <td>
                  <strong>
                    {comparisonData?.bellmanFordCost !== undefined
                      ? (comparisonData.bellmanFordCost === Infinity ? '∞' : comparisonData.bellmanFordCost)
                      : '—'}
                  </strong>
                </td>
                <td><code>O(|V| · |E|)</code></td>
                <td>Distance-Vector (e.g., RIP)</td>
                <td>Iterative relaxation passes over all network edges</td>
              </tr>
            </tbody>
          </table>

          <div className="algo-comparison__note-box">
            <Info size={14} className="algo-comparison__note-icon" />
            <p className="algo-comparison__note">
              Both algorithms guarantee the identical optimal shortest-path cost on non-negative weighted graphs.
              Dijkstra executes faster on complete topologies, while Bellman-Ford iteratively relaxes all edges across rounds.
              <em>Note: RouteLab simulates centralized graph-based routing, not real distributed OSPF LSA flooding or RIP packet exchanges. (BGP is a path-vector protocol).</em>
            </p>
          </div>
        </div>
      )}

      {/* ── TAB 4: EVENT LOG (Compact Table) ───────────────────── */}
      {activeTab === 'log' && (
        <div
          className="event-log-tab"
          role="tabpanel"
          id="panel-log"
          aria-labelledby="tab-log"
          tabIndex={0}
        >
          <div className="event-log-tab__toolbar">
            <div className="event-log-tab__meta">
              <h3 className="event-log-tab__title">Simulation Event Log</h3>
              <span className="event-log-tab__badge">{eventLog.length} recorded events (latest first)</span>
            </div>
            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={onClearEventLog}
              disabled={!eventLog || eventLog.length === 0}
              title="Clear all recorded events"
            >
              <RotateCcw size={12} strokeWidth={1.8} />
              Clear Log
            </button>
          </div>

          {!eventLog || eventLog.length === 0 ? (
            <p className="event-log__empty">No simulation events recorded yet. Perform routing or topology actions to view events.</p>
          ) : (
            <div className="event-log__table-wrap">
              <table className="event-log__table" aria-label="Simulation events table">
                <thead>
                  <tr>
                    <th scope="col" style={{ width: '90px' }}>Time</th>
                    <th scope="col">Event Description</th>
                    <th scope="col" style={{ width: '100px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {eventLog.map((ev) => (
                    <tr key={ev.id} className={`event-log__tr event-log__tr--${ev.type || 'info'}`}>
                      <td className="event-log__td-time"><code>{ev.timestamp}</code></td>
                      <td className="event-log__td-desc">{ev.description}</td>
                      <td className="event-log__td-status">
                        <span className={`status-pill status-pill--${ev.type || 'info'}`}>
                          <span className="status-pill__dot" aria-hidden="true" />
                          {ev.type === 'success' ? 'Success' : ev.type === 'warning' ? 'Warning' : 'Info'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </section>
  )
}

export default ResultsPanel
