/**
 * App.jsx — RouteLab 2.1
 *
 * Professional Network Routing Simulator Architecture:
 *   - Custom Topology Builder: Start from a blank canvas, create custom topologies
 *   - Router Management: Custom router addition, deletion, and display label renaming
 *   - Interactive Packet Mode ("Select on Canvas"): Pick source & destination by clicking canvas routers
 *   - Simulation Event Log: Real-time record of all routing, packet, and topology operations
 *   - Full JSON Export/Import support for custom networks
 *   - Preserved all Phase 1–5 Dijkstra/Bellman-Ford, step visualization, and link failure features
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { useNodesState, useEdgesState } from '@xyflow/react'

import Header        from './components/Header.jsx'
import Sidebar       from './components/Sidebar.jsx'
import NetworkCanvas from './components/NetworkCanvas.jsx'
import ResultsPanel  from './components/ResultsPanel.jsx'
import RouterNode    from './components/RouterNode.jsx'

import { PRESETS }                        from './data/networkPresets.js'
import { buildGraph }                     from './utils/graph.js'
import { runDijkstra, buildRoutingTable } from './utils/dijkstra.js'
import { runBellmanFord, buildRoutingTableBellmanFord } from './utils/bellmanFord.js'
import { exportNetwork, validateAndImportNetwork }       from './utils/serialization.js'

const NODE_TYPES = { routerNode: RouterNode }
const ALPHABET   = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

function App() {
  // ── Preset & Custom Network state ─────────────────────────────────────────
  const [currentPreset, setCurrentPreset] = useState('basic')
  const [customNetworkName, setCustomNetworkName] = useState('Custom Network')
  const initialCustomTopologyRef = useRef({ nodes: [], edges: [] })

  // ── New Network Dialog state ──────────────────────────────────────────────
  const [showNewNetworkModal, setShowNewNetworkModal] = useState(false)
  const [newNetworkInput, setNewNetworkInput] = useState('')

  // ── React Flow state (initialized from basic preset) ──────────────────────
  const [nodes, setNodes, onNodesChange] = useNodesState(PRESETS.basic.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(PRESETS.basic.edges)

  // Live refs to guarantee animation always reads current positions during dragging
  const nodesRef = useRef(nodes)
  nodesRef.current = nodes
  const edgesRef = useRef(edges)
  edgesRef.current = edges

  // ── Canvas selection ─────────────────────────────────────────────────────
  const [selectedNodeId, setSelectedNodeId] = useState(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState(null)

  // ── Path-finder state ─────────────────────────────────────────────────────
  const [sourceId,          setSourceId]          = useState(null)
  const [destinationId,     setDestinationId]     = useState(null)
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('dijkstra') // 'dijkstra' | 'bellman-ford'
  const [activeStepIndex,   setActiveStepIndex]   = useState(0)

  // ── Interactive Packet Mode (Select on Canvas - RouteLab 2.1) ─────────────
  const [isCanvasSelecting, setIsCanvasSelecting] = useState(false)
  const [canvasSelectStep, setCanvasSelectStep]   = useState('source') // 'source' | 'destination'

  // ── Accessibility live announcements ──────────────────────────────────────
  const [liveAnnouncement, setLiveAnnouncement] = useState('')

  // ── Simulation Event Log (RouteLab 2.1) ───────────────────────────────────
  const [eventLog, setEventLog] = useState([])

  const addEvent = useCallback((description, type = 'info') => {
    const now = new Date()
    const timestamp = now.toTimeString().split(' ')[0]
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
    setEventLog((prev) => [{ id, timestamp, description, type }, ...prev].slice(0, 50))
    setLiveAnnouncement(description)
  }, [])

  const handleClearEventLog = useCallback(() => {
    setEventLog([])
    setLiveAnnouncement('Simulation event log cleared.')
  }, [])

  /**
   * pathResult — null before first search, or:
   * {
   *   path:    string[],   ordered node IDs
   *   cost:    number,     Infinity if unreachable
   *   edgeIds: string[],   edge IDs on the path
   *   steps:   Array,      algorithm steps
   * }
   */
  const [pathResult, setPathResult] = useState(null)

  /**
   * lastAction — short informational message shown in ResultsPanel.
   */
  const [lastAction, setLastAction] = useState('')

  // ── Packet Journey Simulation State ───────────────────────────────────────
  const [packetState, setPacketState] = useState({
    status: 'idle', // 'idle' | 'in_transit' | 'delivered' | 'failed'
    currentHop: 0,
    totalHops: 0,
    fromNode: null,
    toNode: null,
    message: '',
  })
  const [packetCoords, setPacketCoords] = useState(null) // { x, y } in flow space
  const [activeHopEdgeId, setActiveHopEdgeId] = useState(null)
  const rafRef = useRef(null)

  // ── Helpers ───────────────────────────────────────────────────────────────

  const clearSelection = useCallback(() => {
    setSelectedNodeId(null)
    setSelectedEdgeId(null)
  }, [])

  /** Safely cancel any active packet animation */
  const cancelPacketAnimation = useCallback((reasonMsg) => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    setPacketCoords(null)
    setActiveHopEdgeId(null)
    setPacketState({
      status: reasonMsg ? 'failed' : 'idle',
      currentHop: 0,
      totalHops: 0,
      fromNode: null,
      toNode: null,
      message: reasonMsg || '',
    })
    if (reasonMsg) {
      addEvent(`Packet transmission halted: ${reasonMsg}`, 'warning')
    }
  }, [addEvent])

  /** Clear path result, active packet animation, and action message on edits */
  const invalidatePath = useCallback((reasonMsg) => {
    cancelPacketAnimation(reasonMsg || '')
    setPathResult(null)
    setActiveStepIndex(0)
    if (!reasonMsg) setLastAction('')
  }, [cancelPacketAnimation])

  const handleSelectAlgorithm = useCallback((algo) => {
    setSelectedAlgorithm(algo)
    invalidatePath()
  }, [invalidatePath])

  // Stop animation loop on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // ── Path finding computation engine ───────────────────────────────────────

  const executePathSearch = useCallback((src, dst, algo) => {
    if (!src || !dst || src === dst) return
    cancelPacketAnimation()
    setActiveStepIndex(0)

    const graph  = buildGraph(nodesRef.current, edgesRef.current)
    const result = algo === 'bellman-ford'
      ? runBellmanFord(graph, src, dst)
      : runDijkstra(graph, src, dst)

    setPathResult({
      path:    result.path,
      cost:    result.cost,
      edgeIds: result.edgeIds,
      steps:   result.steps || [],
    })

    const algoName = algo === 'bellman-ford' ? 'Bellman-Ford' : "Dijkstra's"
    if (result.path.length > 1) {
      setPacketState({
        status: 'idle',
        currentHop: 0,
        totalHops: result.path.length - 1,
        fromNode: src,
        toNode: dst,
        message: `${algoName} route found: ${result.path.join(' → ')} (${result.path.length - 1} hops, cost ${result.cost}). Click Send Packet to transmit.`,
      })
      addEvent(`Shortest path ${src} → ${dst} calculated (${algoName}): ${result.path.join(' → ')} (cost ${result.cost}).`, 'success')
    } else {
      setPacketState({
        status: 'failed',
        currentHop: 0,
        totalHops: 0,
        fromNode: src,
        toNode: dst,
        message: 'No route available between selected routers.',
      })
      addEvent(`Shortest path ${src} → ${dst} failed: Destination is unreachable.`, 'warning')
    }
  }, [cancelPacketAnimation, addEvent])

  // ── Canvas event handlers ─────────────────────────────────────────────────

  const handleNodeClick = useCallback((_e, node) => {
    if (isCanvasSelecting) {
      if (canvasSelectStep === 'source') {
        setSourceId(node.id)
        setDestinationId(null)
        setPathResult(null)
        setCanvasSelectStep('destination')
        addEvent(`Selected source router: ${node.data?.label || node.id}`, 'info')
      } else if (canvasSelectStep === 'destination') {
        if (node.id === sourceId) return // Cannot select same node as source
        setDestinationId(node.id)
        setIsCanvasSelecting(false)
        setCanvasSelectStep('source')
        executePathSearch(sourceId, node.id, selectedAlgorithm)
        addEvent(`Selected destination router: ${node.data?.label || node.id}.`, 'info')
      }
      return
    }

    setSelectedNodeId(node.id)
    setSelectedEdgeId(null)
  }, [isCanvasSelecting, canvasSelectStep, sourceId, selectedAlgorithm, executePathSearch, addEvent])

  const handleEdgeClick = useCallback((_e, edge) => {
    if (isCanvasSelecting) return
    setSelectedEdgeId(edge.id)
    setSelectedNodeId(null)
  }, [isCanvasSelecting])

  const handlePaneClick = useCallback(() => {
    if (!isCanvasSelecting) clearSelection()
  }, [clearSelection, isCanvasSelecting])

  const handleToggleCanvasSelect = useCallback(() => {
    setIsCanvasSelecting((prev) => {
      const next = !prev
      if (next) setCanvasSelectStep('source')
      return next
    })
  }, [])

  const handleCancelCanvasSelect = useCallback(() => {
    setIsCanvasSelecting(false)
    setCanvasSelectStep('source')
  }, [])

  // ── Source / Destination change ──────────────────────────────────────────

  const handleSourceChange = useCallback((id) => {
    setSourceId(id || null)
    invalidatePath()
  }, [invalidatePath])

  const handleDestinationChange = useCallback((id) => {
    setDestinationId(id || null)
    invalidatePath()
  }, [invalidatePath])

  // ── Preset switcher ───────────────────────────────────────────────────────

  const handleSelectPreset = useCallback((presetId) => {
    const targetPreset = PRESETS[presetId]
    if (!targetPreset) return
    cancelPacketAnimation()
    setIsCanvasSelecting(false)
    setCurrentPreset(presetId)
    setNodes(targetPreset.nodes)
    setEdges(targetPreset.edges)
    setSourceId(null)
    setDestinationId(null)
    setPathResult(null)
    setActiveStepIndex(0)
    setLastAction(`Loaded preset: ${targetPreset.name}`)
    addEvent(`Switched preset to "${targetPreset.name}".`, 'info')
    clearSelection()
  }, [cancelPacketAnimation, setNodes, setEdges, clearSelection, addEvent])

  // ── Custom Topology Builder (RouteLab 2.1) ────────────────────────────────

  const handleOpenNewNetwork = useCallback(() => {
    setNewNetworkInput('')
    setShowNewNetworkModal(true)
  }, [])

  const handleConfirmNewNetwork = useCallback((nameInput) => {
    const name = (nameInput || '').trim() || 'Custom Network'
    cancelPacketAnimation('New network created.')
    setIsCanvasSelecting(false)
    setNodes([])
    setEdges([])
    setSourceId(null)
    setDestinationId(null)
    setPathResult(null)
    setActiveStepIndex(0)
    clearSelection()
    setCurrentPreset('custom')
    setCustomNetworkName(name)
    initialCustomTopologyRef.current = { nodes: [], edges: [] }
    setShowNewNetworkModal(false)
    setLastAction(`Created new empty custom network: "${name}". Add routers to begin.`)
    addEvent(`Custom network "${name}" created (empty canvas).`, 'info')
  }, [cancelPacketAnimation, setNodes, setEdges, clearSelection, addEvent])

  // ── Network Reset ─────────────────────────────────────────────────────────

  const handleReset = useCallback(() => {
    cancelPacketAnimation()
    setIsCanvasSelecting(false)
    if (currentPreset === 'custom') {
      const initial = initialCustomTopologyRef.current
      setNodes(initial?.nodes || [])
      setEdges(initial?.edges || [])
      setSourceId(null)
      setDestinationId(null)
      setPathResult(null)
      setActiveStepIndex(0)
      setLastAction(`Reset custom network "${customNetworkName}" to initial state.`)
      addEvent(`Custom network "${customNetworkName}" reset to initial state.`, 'info')
    } else {
      const defaultTopology = PRESETS[currentPreset] || PRESETS.basic
      setNodes(defaultTopology.nodes)
      setEdges(defaultTopology.edges)
      setSourceId(null)
      setDestinationId(null)
      setPathResult(null)
      setActiveStepIndex(0)
      setLastAction(`Reset network to "${defaultTopology.name}".`)
      addEvent(`Network reset to preset: ${defaultTopology.name}.`, 'info')
    }
    clearSelection()
  }, [currentPreset, customNetworkName, cancelPacketAnimation, setNodes, setEdges, clearSelection, addEvent])

  // ── Router Management (Add / Rename / Remove) ─────────────────────────────

  const handleAddRouter = useCallback(() => {
    cancelPacketAnimation('Simulation stopped: topology modified.')
    const usedLabels = new Set(nodes.map((n) => n.data?.label || n.id))
    const usedIds    = new Set(nodes.map((n) => n.id))
    let newLabel = ''
    for (const letter of ALPHABET) {
      if (!usedLabels.has(letter) && !usedIds.has(letter)) {
        newLabel = letter
        break
      }
    }
    if (!newLabel) newLabel = `R${nodes.length + 1}`

    setNodes((prev) => [...prev, {
      id:   newLabel,
      type: 'routerNode',
      position: {
        x: 140 + (nodes.length % 5) * 120,
        y: 110 + Math.floor(nodes.length / 5) * 110,
      },
      data: { label: newLabel },
    }])
    clearSelection()
    invalidatePath()
    addEvent(`Router ${newLabel} added to network.`, 'info')
  }, [nodes, setNodes, clearSelection, invalidatePath, cancelPacketAnimation, addEvent])

  const handleRenameRouter = useCallback((nodeId, newLabel) => {
    const trimmed = (newLabel || '').trim()
    if (!trimmed) return 'Router display label cannot be empty.'

    const isDuplicate = nodes.some(
      (n) => n.id !== nodeId && (
        (n.data?.label || '').toLowerCase() === trimmed.toLowerCase() ||
        n.id.toLowerCase() === trimmed.toLowerCase()
      )
    )
    if (isDuplicate) return `A router with name "${trimmed}" already exists.`

    setNodes((prev) => prev.map((n) =>
      n.id === nodeId ? { ...n, data: { ...n.data, label: trimmed } } : n
    ))
    addEvent(`Router ${nodeId} display label changed to "${trimmed}".`, 'info')
    return null
  }, [nodes, setNodes, addEvent])

  const handleRemoveRouter = useCallback(() => {
    if (!selectedNodeId) return
    cancelPacketAnimation('Simulation stopped: router removed.')
    const targetId = selectedNodeId
    const targetNode = nodes.find((n) => n.id === targetId)
    const targetLabel = targetNode?.data?.label || targetId

    setNodes((prev) => prev.filter((n) => n.id !== targetId))
    setEdges((prev) => prev.filter((e) => e.source !== targetId && e.target !== targetId))
    if (sourceId      === targetId) setSourceId(null)
    if (destinationId === targetId) setDestinationId(null)
    invalidatePath()
    clearSelection()
    addEvent(`Router ${targetLabel} and associated links removed.`, 'warning')
  }, [selectedNodeId, nodes, sourceId, destinationId, setNodes, setEdges, clearSelection, invalidatePath, cancelPacketAnimation, addEvent])

  // ── Link Management (Add / Update / Remove / Toggle) ──────────────────────

  const handleAddLink = useCallback((fromId, toId, cost) => {
    if (fromId === toId)  return 'A router cannot link to itself.'
    if (!fromId || !toId) return 'Please select both routers.'
    const parsedCost = Number(cost)
    if (!Number.isFinite(parsedCost) || parsedCost <= 0)
      return 'Link cost must be a positive number.'

    const duplicate = edges.some(
      (e) => (e.source === fromId && e.target === toId) ||
              (e.source === toId   && e.target === fromId)
    )
    if (duplicate) return `A link between ${fromId} and ${toId} already exists.`

    cancelPacketAnimation('Simulation stopped: new link added.')
    setEdges((prev) => [...prev, {
      id:     `${fromId}-${toId}`,
      source: fromId,
      target: toId,
      label:  String(parsedCost),
      data:   { cost: parsedCost, failed: false, enabled: true },
    }])
    invalidatePath()
    addEvent(`Link ${fromId}–${toId} added (metric: ${parsedCost}).`, 'info')
    return null
  }, [edges, setEdges, invalidatePath, cancelPacketAnimation, addEvent])

  const handleUpdateEdgeCost = useCallback((newCost) => {
    const parsedCost = Number(newCost)
    if (!Number.isFinite(parsedCost) || parsedCost <= 0)
      return 'Cost must be a positive number.'

    const edge = edges.find((e) => e.id === selectedEdgeId)
    cancelPacketAnimation('Simulation stopped: link cost updated.')
    setEdges((prev) => prev.map((e) =>
      e.id === selectedEdgeId
        ? { ...e, label: String(parsedCost), data: { ...e.data, cost: parsedCost } }
        : e
    ))
    invalidatePath()
    if (edge) {
      addEvent(`Link ${edge.source}–${edge.target} cost updated to ${parsedCost}.`, 'info')
    }
    return null
  }, [selectedEdgeId, edges, setEdges, invalidatePath, cancelPacketAnimation, addEvent])

  const handleRemoveEdge = useCallback(() => {
    if (!selectedEdgeId) return
    const edge = edges.find((e) => e.id === selectedEdgeId)
    cancelPacketAnimation('Simulation stopped: link deleted.')
    setEdges((prev) => prev.filter((e) => e.id !== selectedEdgeId))
    invalidatePath()
    clearSelection()
    if (edge) {
      addEvent(`Link ${edge.source}–${edge.target} deleted.`, 'warning')
    }
  }, [selectedEdgeId, edges, setEdges, clearSelection, invalidatePath, cancelPacketAnimation, addEvent])

  const handleToggleLink = useCallback(() => {
    if (!selectedEdgeId) return
    cancelPacketAnimation('Simulation stopped: link state changed.')

    const edge = edges.find((e) => e.id === selectedEdgeId)
    if (!edge) return

    const willBeEnabled = edge.data?.enabled === false

    const nextEdges = edges.map((e) =>
      e.id === selectedEdgeId
        ? { ...e, data: { ...e.data, enabled: !willBeEnabled ? false : true } }
        : e
    )
    setEdges(nextEdges)

    const label = `${edge.source}–${edge.target}`
    const verb  = willBeEnabled ? 'restored' : 'disabled'

    if (pathResult && sourceId && destinationId) {
      const newGraph  = buildGraph(nodes, nextEdges)
      const newResult = selectedAlgorithm === 'bellman-ford'
        ? runBellmanFord(newGraph, sourceId, destinationId)
        : runDijkstra(newGraph, sourceId, destinationId)

      setPathResult({
        path:    newResult.path,
        cost:    newResult.cost,
        edgeIds: newResult.edgeIds,
        steps:   newResult.steps || [],
      })
      setActiveStepIndex(0)

      const routeMsg = newResult.path.length > 0
        ? `New route: ${newResult.path.join(' → ')} (cost ${newResult.cost})`
        : 'No alternative route available.'

      setLastAction(`Link ${label} ${verb}. ${routeMsg}`)
      addEvent(`Link ${label} ${verb}. ${routeMsg}`, willBeEnabled ? 'success' : 'warning')
    } else {
      setLastAction(`Link ${label} ${verb}.`)
      addEvent(`Link ${label} ${verb}.`, willBeEnabled ? 'success' : 'warning')
    }
  }, [selectedEdgeId, edges, setEdges, pathResult, sourceId, destinationId, nodes, selectedAlgorithm, cancelPacketAnimation, addEvent])

  // ── Manual Find Path ──────────────────────────────────────────────────────

  const handleFindPath = useCallback(() => {
    if (!sourceId || !destinationId) return
    executePathSearch(sourceId, destinationId, selectedAlgorithm)
  }, [sourceId, destinationId, selectedAlgorithm, executePathSearch])

  const handleResetPath = useCallback(() => {
    cancelPacketAnimation()
    setPathResult(null)
    setActiveStepIndex(0)
    setLastAction('')
    addEvent('Active route cleared.', 'info')
  }, [cancelPacketAnimation, addEvent])

  // ── Packet Journey Simulation Engine ──────────────────────────────────────

  const handleSendPacket = useCallback(() => {
    if (!pathResult || !pathResult.path || pathResult.path.length <= 1) {
      setPacketState({
        status: 'failed',
        currentHop: 0,
        totalHops: 0,
        fromNode: null,
        toNode: null,
        message: 'Cannot send packet: No valid route calculated.',
      })
      return
    }

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }

    const path = pathResult.path
    const hops = []
    for (let i = 0; i < path.length - 1; i++) {
      const from = path[i]
      const to   = path[i + 1]
      const matchingEdge = edgesRef.current.find(
        (e) => (e.source === from && e.target === to) || (e.source === to && e.target === from)
      )
      hops.push({
        from,
        to,
        edgeId: matchingEdge?.id ?? `${from}-${to}`,
      })
    }

    if (hops.length === 0) return

    const HOP_DURATION = 750
    const totalHops = hops.length
    const startTime = performance.now()

    setPacketState({
      status: 'in_transit',
      currentHop: 1,
      totalHops,
      fromNode: hops[0].from,
      toNode: hops[0].to,
      message: `Hop 1 of ${totalHops} (${hops[0].from} → ${hops[0].to})...`,
    })
    addEvent(`Packet transmission started: ${path[0]} → ${path[path.length - 1]} (${totalHops} hops).`, 'info')

    function step(now) {
      const elapsed = now - startTime
      const hopIndex = Math.floor(elapsed / HOP_DURATION)

      if (hopIndex >= totalHops) {
        const destNode = nodesRef.current.find((n) => n.id === hops[totalHops - 1].to)
        if (destNode) {
          setPacketCoords({ x: destNode.position.x + 26, y: destNode.position.y + 26 })
        }
        setActiveHopEdgeId(null)
        setPacketState({
          status: 'delivered',
          currentHop: totalHops,
          totalHops,
          fromNode: hops[totalHops - 1].from,
          toNode: hops[totalHops - 1].to,
          message: `Packet delivered successfully from ${path[0]} to ${path[path.length - 1]} (${totalHops} hops, cost ${pathResult.cost}).`,
        })
        addEvent(`Packet delivered successfully to ${path[path.length - 1]} (total cost: ${pathResult.cost}).`, 'success')
        rafRef.current = null
        return
      }

      const curHop = hops[hopIndex]
      const hopElapsed = elapsed - hopIndex * HOP_DURATION
      const progress = Math.min(Math.max(hopElapsed / HOP_DURATION, 0), 1)

      const uNode = nodesRef.current.find((n) => n.id === curHop.from)
      const vNode = nodesRef.current.find((n) => n.id === curHop.to)

      if (uNode && vNode) {
        const ux = uNode.position.x + 26
        const uy = uNode.position.y + 26
        const vx = vNode.position.x + 26
        const vy = vNode.position.y + 26

        setPacketCoords({
          x: ux + (vx - ux) * progress,
          y: uy + (vy - uy) * progress,
        })
      }

      setActiveHopEdgeId(curHop.edgeId)
      setPacketState((prev) => ({
        ...prev,
        status: 'in_transit',
        currentHop: hopIndex + 1,
        totalHops,
        fromNode: curHop.from,
        toNode: curHop.to,
        message: `Hop ${hopIndex + 1} of ${totalHops} (${curHop.from} → ${curHop.to})...`,
      }))

      rafRef.current = requestAnimationFrame(step)
    }

    rafRef.current = requestAnimationFrame(step)
  }, [pathResult, addEvent])

  // ── Routing table ─────────────────────────────────────────────────────────

  const routingTable = useMemo(() => {
    if (!sourceId) return []
    const graph   = buildGraph(nodes, edges)
    const nodeIds = nodes.map((n) => n.id)
    if (selectedAlgorithm === 'bellman-ford') {
      return buildRoutingTableBellmanFord(graph, nodeIds, sourceId)
    }
    return buildRoutingTable(graph, nodeIds, sourceId)
  }, [sourceId, nodes, edges, selectedAlgorithm])

  // ── Algorithm Comparison Metrics ──────────────────────────────────────────

  const comparisonData = useMemo(() => {
    if (!sourceId || !destinationId) return { dijkstraCost: undefined, bellmanFordCost: undefined }
    const graph = buildGraph(nodes, edges)
    const dRes = runDijkstra(graph, sourceId, destinationId)
    const bRes = runBellmanFord(graph, sourceId, destinationId)
    return {
      dijkstraCost:    dRes.cost,
      bellmanFordCost: bRes.cost,
    }
  }, [sourceId, destinationId, nodes, edges])

  // ── Network Export & Import ───────────────────────────────────────────────

  const handleExportNetwork = useCallback(() => {
    const networkName = currentPreset === 'custom'
      ? customNetworkName
      : (PRESETS[currentPreset]?.name || 'RouteLab Network')
    exportNetwork(nodes, edges, networkName)
    setLastAction(`Exported "${networkName}" successfully as JSON.`)
    addEvent(`Topology "${networkName}" exported as JSON file.`, 'info')
  }, [nodes, edges, currentPreset, customNetworkName, addEvent])

  const handleImportNetwork = useCallback((jsonString) => {
    cancelPacketAnimation('Importing network topology.')
    setIsCanvasSelecting(false)
    const result = validateAndImportNetwork(jsonString)
    if (!result.success) {
      setLastAction(`Import failed: ${result.error}`)
      addEvent(`Import failed: ${result.error}`, 'warning')
      alert(`Import failed: ${result.error}`)
      return
    }

    setNodes(result.network.nodes)
    setEdges(result.network.edges)
    setCurrentPreset('custom')
    setCustomNetworkName(result.network.name)
    initialCustomTopologyRef.current = {
      nodes: result.network.nodes,
      edges: result.network.edges,
    }
    setSourceId(null)
    setDestinationId(null)
    setPathResult(null)
    setActiveStepIndex(0)
    clearSelection()
    setLastAction(`Imported topology: "${result.network.name}" (${result.network.nodes.length} routers, ${result.network.edges.length} links).`)
    addEvent(`Imported topology "${result.network.name}" (${result.network.nodes.length} routers, ${result.network.edges.length} links).`, 'info')
  }, [cancelPacketAnimation, setNodes, setEdges, clearSelection, addEvent])

  // ── Derived: selected edge object ─────────────────────────────────────────

  const selectedEdge = edges.find((e) => e.id === selectedEdgeId) ?? null

  // ── Path sets ─────────────────────────────────────────────────────────────

  const pathNodeSet = useMemo(
    () => new Set(pathResult?.path ?? []),
    [pathResult]
  )
  const pathEdgeSet = useMemo(
    () => new Set(pathResult?.edgeIds ?? []),
    [pathResult]
  )

  const activeStep = pathResult?.steps?.[activeStepIndex]
  const activeStepNode = (selectedAlgorithm === 'dijkstra' && activeStep && activeStep.currentNode !== 'Init')
    ? activeStep.currentNode
    : null

  const canSendPacket = Boolean(pathResult && pathResult.path && pathResult.path.length > 1)
  const isPacketInTransit = packetState.status === 'in_transit'

  // Active network name
  const activeNetworkName = currentPreset === 'custom'
    ? customNetworkName
    : (PRESETS[currentPreset]?.name || 'RouteLab Network')

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="app-root">
      {/* Screen Reader Live Region */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {liveAnnouncement}
      </div>

      <Header
        currentPreset={currentPreset}
        customNetworkName={customNetworkName}
        onSelectPreset={handleSelectPreset}
        onOpenNewNetwork={handleOpenNewNetwork}
        onReset={handleReset}
        onExport={handleExportNetwork}
        onImport={handleImportNetwork}
      />

      <div className="app-body">
        <Sidebar
          nodes={nodes}
          edges={edges}
          selectedNodeId={selectedNodeId}
          selectedEdge={selectedEdge}
          sourceId={sourceId}
          destinationId={destinationId}
          currentPreset={currentPreset}
          selectedAlgorithm={selectedAlgorithm}
          isCanvasSelecting={isCanvasSelecting}
          canvasSelectStep={canvasSelectStep}
          onToggleCanvasSelect={handleToggleCanvasSelect}
          onRenameRouter={handleRenameRouter}
          onSelectAlgorithm={handleSelectAlgorithm}
          onSelectPreset={handleSelectPreset}
          onSourceChange={handleSourceChange}
          onDestinationChange={handleDestinationChange}
          onFindPath={handleFindPath}
          onResetPath={handleResetPath}
          onSendPacket={handleSendPacket}
          canSendPacket={canSendPacket}
          isPacketInTransit={isPacketInTransit}
          onAddRouter={handleAddRouter}
          onRemoveRouter={handleRemoveRouter}
          onAddLink={handleAddLink}
          onUpdateEdgeCost={handleUpdateEdgeCost}
          onRemoveEdge={handleRemoveEdge}
          onToggleLink={handleToggleLink}
        />

        <NetworkCanvas
          key={`${currentPreset}-${customNetworkName}`}
          nodes={nodes}
          edges={edges}
          networkName={activeNetworkName}
          selectedEdgeId={selectedEdgeId}
          selectedNodeId={selectedNodeId}
          sourceId={sourceId}
          destinationId={destinationId}
          pathNodeSet={pathNodeSet}
          pathEdgeSet={pathEdgeSet}
          activeStepNode={activeStepNode}
          packetCoords={packetCoords}
          activeHopEdgeId={activeHopEdgeId}
          isCanvasSelecting={isCanvasSelecting}
          canvasSelectStep={canvasSelectStep}
          onCancelCanvasSelect={handleCancelCanvasSelect}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          onEdgeClick={handleEdgeClick}
          onPaneClick={handlePaneClick}
          nodeTypes={NODE_TYPES}
        />
      </div>

      <ResultsPanel
        pathResult={pathResult}
        routingTable={routingTable}
        sourceId={sourceId}
        destinationId={destinationId}
        lastAction={lastAction}
        packetState={packetState}
        selectedAlgorithm={selectedAlgorithm}
        comparisonData={comparisonData}
        activeStepIndex={activeStepIndex}
        onStepChange={setActiveStepIndex}
        onResetSteps={() => setActiveStepIndex(0)}
        allNodeIds={nodes.map((n) => n.id)}
        eventLog={eventLog}
        onClearEventLog={handleClearEventLog}
      />

      {/* Lightweight Create New Network Modal */}
      {showNewNetworkModal && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-net-title"
          aria-describedby="new-net-desc"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowNewNetworkModal(false)
          }}
        >
          <div className="modal-card">
            <h3 id="new-net-title" className="modal-card__title">Create New Custom Network</h3>
            <p id="new-net-desc" className="modal-card__desc">
              Start building a custom network topology from a completely blank canvas.
            </p>

            {nodes.length > 0 && (
              <div className="modal-card__warning" role="note">
                <strong>Notice:</strong> Creating a new network will discard any unsaved routers ({nodes.length}) and links ({edges.length}) in the current canvas.
              </div>
            )}

            <div className="sidebar__field" style={{ marginTop: 12 }}>
              <label className="sidebar__label" htmlFor="new-net-name-input">Network Name</label>
              <input
                id="new-net-name-input"
                type="text"
                className="sidebar__input"
                value={newNetworkInput}
                onChange={(e) => setNewNetworkInput(e.target.value)}
                placeholder="e.g. Enterprise WAN"
                maxLength={40}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirmNewNetwork(newNetworkInput)
                  if (e.key === 'Escape') setShowNewNetworkModal(false)
                }}
              />
            </div>

            <div className="modal-card__actions">
              <button
                type="button"
                className="btn btn--outline btn--sm"
                onClick={() => setShowNewNetworkModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn--primary btn--sm"
                onClick={() => handleConfirmNewNetwork(newNetworkInput)}
              >
                Create Blank Network
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
