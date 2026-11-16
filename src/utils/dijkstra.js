/**
 * dijkstra.js — Phase 3
 *
 * Implements Dijkstra's shortest-path algorithm for a small educational network.
 *
 * Design choices (viva-friendly):
 *   - Simple O(V² + E) "scan the unvisited set" approach — easy to trace on a whiteboard.
 *   - No external library. Pure JavaScript.
 *   - Immutable: does not mutate the adjacency list passed in.
 *   - Deterministic: nodes are sorted alphabetically before each scan so ties
 *     always break the same way (useful for reproducible test results).
 *
 * Public API
 * ──────────
 *   runDijkstra(graph, source, destination)
 *     → { path, cost, edgeIds, visited, distances, predecessors }
 *
 *   buildRoutingTable(graph, nodeIds, source)
 *     → Array<{ destination, nextHop, cost, path }>
 */

/**
 * Run Dijkstra's algorithm between two nodes.
 *
 * @param {Map}    graph       - Adjacency list: nodeId → [{neighbor, cost, edgeId}]
 * @param {string} source      - Start node ID
 * @param {string} destination - End node ID
 * @returns {{
 *   path:         string[],   // ordered node IDs from source to destination
 *   cost:         number,     // total path cost (Infinity if unreachable)
 *   edgeIds:      string[],   // edge IDs on the path (for canvas highlighting)
 *   visited:      string[],   // nodes processed in order
 *   distances:    Map,        // shortest distance from source to every node
 *   predecessors: Map,        // predecessor node on the shortest path
 *   steps:        Array,      // Step-by-step algorithm trace (RouteLab Phase 7)
 * }}
 */
export function runDijkstra(graph, source, destination) {
  // ── Edge cases ─────────────────────────────────────────────────────────────

  // Source equals destination — trivial path of zero cost.
  if (source === destination) {
    const singleDist = new Map([[source, 0]])
    const singlePred = new Map([[source, null]])
    return {
      path: [source],
      cost: 0,
      edgeIds: [],
      visited: [source],
      distances: singleDist,
      predecessors: singlePred,
      steps: [
        {
          stepNumber: 0,
          currentNode: source,
          visitedNodes: [source],
          distances: Object.fromEntries(singleDist),
          predecessors: Object.fromEntries(singlePred),
          description: `Source and destination are both router ${source}. Shortest distance is 0.`,
          updatedNodes: [source],
        },
      ],
    }
  }

  // Source not in graph — treat as disconnected.
  if (!graph || !graph.has(source)) {
    return {
      path: [],
      cost: Infinity,
      edgeIds: [],
      visited: [],
      distances: new Map(),
      predecessors: new Map(),
      steps: [
        {
          stepNumber: 0,
          currentNode: source,
          visitedNodes: [],
          distances: {},
          predecessors: {},
          description: `Source router ${source} is not present in the active network graph.`,
          updatedNodes: [],
        },
      ],
    }
  }

  // ── Initialisation ─────────────────────────────────────────────────────────

  const distances    = new Map()   // best known distance from source to each node
  const predecessors = new Map()   // which node we came from on the best path
  const predEdge     = new Map()   // which edge ID we used to arrive at each node
  const visited      = new Set()   // set of nodes whose shortest path is finalised
  const visitedOrder = []          // ordered list of settled nodes
  const steps        = []          // algorithm trace snapshots

  // All nodes start with distance = Infinity, no predecessor.
  for (const nodeId of graph.keys()) {
    distances.set(nodeId, Infinity)
    predecessors.set(nodeId, null)
    predEdge.set(nodeId, null)
  }
  distances.set(source, 0)

  // Step 0 Snapshot — Initial state
  steps.push({
    stepNumber: 0,
    currentNode: 'Init',
    visitedNodes: [],
    distances: Object.fromEntries(distances),
    predecessors: Object.fromEntries(predecessors),
    description: `Initialization: Source router ${source} distance set to 0. All other routers initialized to ∞.`,
    updatedNodes: [source],
  })

  // ── Main loop ──────────────────────────────────────────────────────────────
  let stepCounter = 1

  while (true) {
    // 1. Pick the unvisited node with the smallest known distance.
    //    Sort alphabetically for deterministic tie-breaking.
    let u = null
    let uDist = Infinity

    const sortedNodes = [...graph.keys()].sort()

    for (const nodeId of sortedNodes) {
      if (!visited.has(nodeId) && distances.get(nodeId) <= uDist) {
        if (distances.get(nodeId) < uDist) {
          u = nodeId
          uDist = distances.get(nodeId)
        } else if (u === null) {
          u = nodeId
          uDist = distances.get(nodeId)
        }
      }
    }

    // No reachable unvisited node — we're done (or graph is disconnected).
    if (u === null || uDist === Infinity) {
      if (!visited.has(destination)) {
        steps.push({
          stepNumber: stepCounter++,
          currentNode: null,
          visitedNodes: [...visited],
          distances: Object.fromEntries(distances),
          predecessors: Object.fromEntries(predecessors),
          description: `No remaining reachable unvisited routers. Destination ${destination} cannot be reached from ${source}.`,
          updatedNodes: [],
        })
      }
      break
    }

    // 2. Mark u as settled.
    visited.add(u)
    visitedOrder.push(u)

    // 3. Relax all incident links from u.
    const updatedNeighbors = []

    for (const { neighbor, cost, edgeId } of (graph.get(u) ?? [])) {
      if (visited.has(neighbor)) continue

      const newDist = uDist + cost
      const oldDist = distances.get(neighbor)

      if (newDist < oldDist) {
        distances.set(neighbor, newDist)
        predecessors.set(neighbor, u)
        predEdge.set(neighbor, edgeId)
        updatedNeighbors.push({
          neighbor,
          oldDist: oldDist === Infinity ? '∞' : oldDist,
          newDist,
          cost,
        })
      }
    }

    // Snapshot after settling u and relaxing its neighbors
    let desc = `Step ${stepCounter}: Visiting router ${u} (tentative distance ${uDist}). `
    if (updatedNeighbors.length > 0) {
      const relaxDetails = updatedNeighbors
        .map((n) => `router ${n.neighbor} via ${u} reduced from ${n.oldDist} to ${n.newDist}`)
        .join('; ')
      desc += `Relaxed incident links: ${relaxDetails}.`
    } else {
      desc += `Relaxed incident links: no neighboring distances were improved.`
    }

    if (u === destination) {
      desc += ` Destination ${destination} has been settled with final minimum cost ${uDist}.`
    }

    steps.push({
      stepNumber: stepCounter++,
      currentNode: u,
      visitedNodes: [...visited],
      distances: Object.fromEntries(distances),
      predecessors: Object.fromEntries(predecessors),
      description: desc,
      updatedNodes: updatedNeighbors.map((n) => n.neighbor),
    })

    // 4. If we just settled the destination, terminate early.
    if (u === destination) break
  }

  // ── Reconstruct path ───────────────────────────────────────────────────────

  const destDist = distances.get(destination) ?? Infinity

  if (destDist === Infinity) {
    // Destination is unreachable.
    return {
      path: [],
      cost: Infinity,
      edgeIds: [],
      visited: visitedOrder,
      distances,
      predecessors,
      steps,
    }
  }

  // Walk predecessors backwards from destination to source.
  const path    = []
  const edgeIds = []
  let current   = destination

  while (current !== null) {
    path.unshift(current)
    const prevEdge = predEdge.get(current)
    if (prevEdge !== null) edgeIds.unshift(prevEdge)
    current = predecessors.get(current) ?? null
  }

  return {
    path,
    cost: destDist,
    edgeIds,
    visited: visitedOrder,
    distances,
    predecessors,
    steps,
  }
}

/**
 * Build a complete routing table for a source node.
 *
 * Runs Dijkstra once from the source, then derives next-hop information
 * for every other node in the network.
 *
 * @param {Map}      graph   - Adjacency list from buildGraph()
 * @param {string[]} nodeIds - All node IDs in sorted order
 * @param {string}   source  - Source router
 * @returns {Array<{
 *   destination: string,
 *   nextHop:     string,   // '—' for source or unreachable
 *   cost:        number,   // Infinity for unreachable
 *   path:        string[], // empty for unreachable
 * }>}
 */
export function buildRoutingTable(graph, nodeIds, source) {
  // Run Dijkstra from source to every node simultaneously.
  // We pass a sentinel destination that won't terminate the loop early.
  // We achieve this by running Dijkstra to the source itself (cost 0 trivially)
  // and then using the full distances/predecessors maps it returns.

  // Run with a dummy destination that forces the full graph traversal:
  // pick a node that is definitely NOT the source (or just run once and use maps).
  // Actually, our implementation halts when u === destination, so we need a trick:
  // Run Dijkstra with destination = source — that returns only source info.
  // Instead, we run a full traversal by omitting the early-break condition.
  // The simplest fix: call _dijkstraFull() internally.

  const { distances, predecessors, predEdge } = _dijkstraFull(graph, source)

  const table = []

  for (const dest of [...nodeIds].sort()) {
    if (dest === source) {
      table.push({
        destination: dest,
        nextHop: '—',
        cost: 0,
        path: [source],
      })
      continue
    }

    const cost = distances.get(dest) ?? Infinity

    if (cost === Infinity) {
      table.push({
        destination: dest,
        nextHop: '—',
        cost: Infinity,
        path: [],
      })
      continue
    }

    // Reconstruct the path to this destination.
    const path = []
    let cur = dest
    while (cur !== null) {
      path.unshift(cur)
      cur = predecessors.get(cur) ?? null
    }

    // The next hop is the second node in the path (first after source).
    const nextHop = path.length > 1 ? path[1] : '—'

    table.push({ destination: dest, nextHop, cost, path })
  }

  return table
}

// ── Internal full-traversal Dijkstra ─────────────────────────────────────────
// Same as runDijkstra but never exits early on reaching destination,
// so distances/predecessors for ALL nodes are populated.

function _dijkstraFull(graph, source) {
  const distances    = new Map()
  const predecessors = new Map()
  const predEdge     = new Map()
  const visited      = new Set()

  for (const nodeId of graph.keys()) {
    distances.set(nodeId, Infinity)
    predecessors.set(nodeId, null)
    predEdge.set(nodeId, null)
  }
  distances.set(source, 0)

  const sortedNodes = [...graph.keys()].sort()

  while (true) {
    // Find unvisited node with smallest distance (alphabetical tie-break).
    let u = null
    let uDist = Infinity

    for (const nodeId of sortedNodes) {
      if (!visited.has(nodeId)) {
        const d = distances.get(nodeId)
        if (d < uDist || (d === uDist && u === null)) {
          u = nodeId
          uDist = d
        }
      }
    }

    if (u === null || uDist === Infinity) break

    visited.add(u)

    for (const { neighbor, cost, edgeId } of (graph.get(u) ?? [])) {
      if (visited.has(neighbor)) continue
      const newDist = uDist + cost
      if (newDist < distances.get(neighbor)) {
        distances.set(neighbor, newDist)
        predecessors.set(neighbor, u)
        predEdge.set(neighbor, edgeId)
      }
    }
  }

  return { distances, predecessors, predEdge }
}
