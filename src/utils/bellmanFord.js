/**
 * bellmanFord.js — RouteLab 2.0 (Phase 7)
 *
 * Implements the Bellman-Ford shortest-path algorithm for weighted graphs.
 *
 * Characteristics:
 *   - Computes single-source shortest paths through repeated edge relaxations.
 *   - Runs in O(|V| * |E|) time by performing up to (|V| - 1) relaxation passes.
 *   - Early termination optimization: halts as soon as a pass yields no updates.
 *   - Handles undirected networks by relaxing bidirectional edges.
 *   - Deterministic: nodes and edges are processed in sorted order.
 *   - Operates on positive link costs (matching RouteLab network rules).
 *
 * Public API:
 *   runBellmanFord(graph, source, destination)
 *     → { path, cost, edgeIds, distances, predecessors }
 *
 *   buildRoutingTableBellmanFord(graph, nodeIds, source)
 *     → Array<{ destination, nextHop, cost, path }>
 */

/**
 * Run Bellman-Ford algorithm between source and destination.
 *
 * @param {Map}    graph       - Adjacency list: nodeId → [{neighbor, cost, edgeId}]
 * @param {string} source      - Start router ID
 * @param {string} destination - Target router ID
 * @returns {{
 *   path:         string[],   // ordered router IDs
 *   cost:         number,     // total cost (Infinity if unreachable)
 *   edgeIds:      string[],   // edge IDs on path
 *   distances:    Map,        // shortest distance map
 *   predecessors: Map         // predecessor map
 * }}
 */
export function runBellmanFord(graph, source, destination) {
  // ── Edge cases ─────────────────────────────────────────────────────────────

  if (source === destination) {
    return {
      path: [source],
      cost: 0,
      edgeIds: [],
      distances: new Map([[source, 0]]),
      predecessors: new Map(),
    }
  }

  if (!graph || !graph.has(source)) {
    return {
      path: [],
      cost: Infinity,
      edgeIds: [],
      distances: new Map(),
      predecessors: new Map(),
    }
  }

  // ── Initialization ─────────────────────────────────────────────────────────

  const distances    = new Map()
  const predecessors = new Map()
  const predEdge     = new Map()

  const nodeIds = [...graph.keys()].sort()
  const numVertices = nodeIds.length

  for (const nodeId of nodeIds) {
    distances.set(nodeId, Infinity)
    predecessors.set(nodeId, null)
    predEdge.set(nodeId, null)
  }
  distances.set(source, 0)

  // ── Relaxation passes (|V| - 1 iterations) ─────────────────────────────────

  for (let iter = 1; iter < numVertices; iter++) {
    let anyUpdate = false

    // Process vertices in deterministic order
    for (const u of nodeIds) {
      const uDist = distances.get(u)
      if (uDist === Infinity) continue

      const neighbors = graph.get(u) ?? []
      // Sort neighbors for deterministic tie-breaking
      const sortedNeighbors = [...neighbors].sort((a, b) => a.neighbor.localeCompare(b.neighbor))

      for (const { neighbor: v, cost, edgeId } of sortedNeighbors) {
        const newDist = uDist + cost
        if (newDist < distances.get(v)) {
          distances.set(v, newDist)
          predecessors.set(v, u)
          predEdge.set(v, edgeId)
          anyUpdate = true
        }
      }
    }

    // Early termination if converged
    if (!anyUpdate) break
  }

  // ── Path reconstruction ───────────────────────────────────────────────────

  const destDist = distances.get(destination) ?? Infinity

  if (destDist === Infinity) {
    return {
      path: [],
      cost: Infinity,
      edgeIds: [],
      distances,
      predecessors,
    }
  }

  const path    = []
  const edgeIds = []
  let current   = destination

  while (current !== null) {
    path.unshift(current)
    const prevE = predEdge.get(current)
    if (prevE !== null) edgeIds.unshift(prevE)
    current = predecessors.get(current) ?? null
  }

  return {
    path,
    cost: destDist,
    edgeIds,
    distances,
    predecessors,
  }
}

/**
 * Build a complete routing table using Bellman-Ford from a source router.
 *
 * @param {Map}      graph   - Adjacency list from buildGraph()
 * @param {string[]} nodeIds - All node IDs
 * @param {string}   source  - Source router ID
 * @returns {Array<{ destination, nextHop, cost, path }>}
 */
export function buildRoutingTableBellmanFord(graph, nodeIds, source) {
  if (!graph || !graph.has(source)) return []

  const distances    = new Map()
  const predecessors = new Map()

  const allNodes = [...nodeIds].sort()
  const numVertices = allNodes.length

  for (const nodeId of allNodes) {
    distances.set(nodeId, Infinity)
    predecessors.set(nodeId, null)
  }
  distances.set(source, 0)

  for (let iter = 1; iter < numVertices; iter++) {
    let anyUpdate = false

    for (const u of allNodes) {
      const uDist = distances.get(u)
      if (uDist === Infinity) continue

      const neighbors = graph.get(u) ?? []
      const sortedNeighbors = [...neighbors].sort((a, b) => a.neighbor.localeCompare(b.neighbor))

      for (const { neighbor: v, cost } of sortedNeighbors) {
        const newDist = uDist + cost
        if (newDist < distances.get(v)) {
          distances.set(v, newDist)
          predecessors.set(v, u)
          anyUpdate = true
        }
      }
    }

    if (!anyUpdate) break
  }

  const table = []

  for (const dest of allNodes) {
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

    const path = []
    let cur = dest
    while (cur !== null) {
      path.unshift(cur)
      cur = predecessors.get(cur) ?? null
    }

    const nextHop = path.length > 1 ? path[1] : '—'

    table.push({ destination: dest, nextHop, cost, path })
  }

  return table
}
