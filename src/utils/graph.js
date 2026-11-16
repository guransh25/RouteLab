/**
 * graph.js
 * Utility to build an adjacency-list representation from React Flow nodes/edges.
 *
 * buildGraph(nodes, edges) → Map<nodeId, [{neighbor, cost, edgeId}]>
 *
 * Phase 4: edges with enabled === false are excluded from the graph,
 * simulating a link failure without permanently deleting the edge.
 */

/**
 * Builds an undirected adjacency list from React Flow nodes and edges.
 * Edges that are disabled (enabled === false) or failed (data.failed === true)
 * are excluded so Dijkstra treats them as non-existent.
 *
 * @param {Array} nodes  - React Flow node objects
 * @param {Array} edges  - React Flow edge objects
 * @returns {Map}        - Adjacency list: nodeId → [{neighbor, cost, edgeId}]
 */
export function buildGraph(nodes, edges) {
  const graph = new Map()

  // Initialise every node with an empty neighbour list
  nodes.forEach((node) => graph.set(node.id, []))

  edges.forEach((edge) => {
    // Skip failed links (legacy flag) or disabled links (Phase 4)
    if (edge.data?.failed)           return
    if (edge.data?.enabled === false) return

    const cost = edge.data?.cost ?? 1

    graph.get(edge.source)?.push({ neighbor: edge.target, cost, edgeId: edge.id })
    graph.get(edge.target)?.push({ neighbor: edge.source, cost, edgeId: edge.id })
  })

  return graph
}

/**
 * Returns all unique node IDs present in the node array.
 * Convenience helper used by the Sidebar router selectors.
 *
 * @param {Array} nodes - React Flow node objects
 * @returns {string[]}
 */
export function getNodeIds(nodes) {
  return nodes.map((n) => n.id)
}
