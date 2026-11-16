/**
 * serialization.js — RouteLab 2.0 (Phase 7)
 *
 * Implements client-side JSON export and import with rigorous schema validation.
 *
 * Export Schema (Version 1):
 * {
 *   schemaVersion: 1,
 *   name: string,
 *   exportedAt: string (ISO),
 *   routers: Array<{ id, label, position: { x, y } }>,
 *   links: Array<{ id, source, target, cost, enabled }>
 * }
 */

export const SCHEMA_VERSION = 1
const MAX_FILE_SIZE = 500 * 1024 // 500 KB
const MAX_ROUTERS   = 50
const MAX_LINKS     = 100

/**
 * Serializes the current active topology and triggers a browser file download.
 * Does not include transient UI states (animation coordinates, selections, etc.).
 *
 * @param {Array}  nodes       - React Flow nodes
 * @param {Array}  edges       - React Flow edges
 * @param {string} networkName - Name/preset of the network
 */
export function exportNetwork(nodes, edges, networkName = 'RouteLab Network') {
  const exportData = {
    schemaVersion: SCHEMA_VERSION,
    name: networkName,
    exportedAt: new Date().toISOString(),
    routers: nodes.map((n) => ({
      id: String(n.id),
      label: String(n.data?.label ?? n.id),
      position: {
        x: Math.round(Number(n.position?.x) || 0),
        y: Math.round(Number(n.position?.y) || 0),
      },
    })),
    links: edges.map((e) => ({
      id: String(e.id),
      source: String(e.source),
      target: String(e.target),
      cost: Number(e.data?.cost ?? e.label ?? 1),
      enabled: e.data?.enabled !== false,
    })),
  }

  const jsonString = JSON.stringify(exportData, null, 2)
  const blob = new Blob([jsonString], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const sanitizedName = networkName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const fileName = `routelab-${sanitizedName || 'network'}.json`

  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  return fileName
}

/**
 * Validates a JSON string and constructs React Flow node and edge objects.
 *
 * @param {string} jsonString - The raw file content
 * @returns {{
 *   success: boolean,
 *   network?: { name: string, nodes: Array, edges: Array },
 *   error?: string
 * }}
 */
export function validateAndImportNetwork(jsonString) {
  if (typeof jsonString !== 'string' || !jsonString.trim()) {
    return { success: false, error: 'The uploaded file is empty or not text.' }
  }

  if (jsonString.length > MAX_FILE_SIZE) {
    return { success: false, error: 'File size exceeds the maximum limit of 500 KB.' }
  }

  let data
  try {
    data = JSON.parse(jsonString)
  } catch (err) {
    return { success: false, error: 'Invalid JSON format: file could not be parsed.' }
  }

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { success: false, error: 'Invalid JSON: root must be an object.' }
  }

  // Schema version check
  if (data.schemaVersion !== SCHEMA_VERSION) {
    return {
      success: false,
      error: `Unsupported schema version: expected ${SCHEMA_VERSION}, received ${data.schemaVersion ?? 'unknown'}.`,
    }
  }

  // Validate Routers (accepts "routers" or "nodes")
  const rawRouters = data.routers || data.nodes
  if (!Array.isArray(rawRouters)) {
    return { success: false, error: 'Network must contain an array of routers.' }
  }

  if (rawRouters.length > MAX_ROUTERS) {
    return { success: false, error: `Router count exceeds maximum allowed (${MAX_ROUTERS}).` }
  }

  const routerIdSet = new Set()
  const validatedNodes = []

  for (let i = 0; i < rawRouters.length; i++) {
    const r = rawRouters[i]
    if (!r || typeof r !== 'object') {
      return { success: false, error: `Router at index ${i} is not a valid object.` }
    }

    const id = typeof r.id === 'string' ? r.id.trim() : String(r.id ?? '').trim()
    if (!id) {
      return { success: false, error: `Router at index ${i} has an empty or invalid ID.` }
    }

    if (routerIdSet.has(id)) {
      return { success: false, error: `Duplicate router ID detected: "${id}".` }
    }
    routerIdSet.add(id)

    const posX = Number(r.position?.x ?? r.x ?? (140 + (i % 5) * 120))
    const posY = Number(r.position?.y ?? r.y ?? (100 + Math.floor(i / 5) * 110))
    if (!Number.isFinite(posX) || !Number.isFinite(posY)) {
      return { success: false, error: `Router "${id}" has invalid position coordinates.` }
    }

    const label = typeof r.label === 'string' && r.label.trim() ? r.label.trim() : id

    validatedNodes.push({
      id,
      type: 'routerNode',
      position: { x: posX, y: posY },
      data: { label },
    })
  }

  // Validate Links (accepts "links" or "edges")
  const validatedEdges = []
  const edgePairSet = new Set()
  const rawLinks = data.links !== undefined ? data.links : data.edges

  if (rawLinks != null) {
    if (!Array.isArray(rawLinks)) {
      return { success: false, error: 'Links property must be an array.' }
    }

    if (rawLinks.length > MAX_LINKS) {
      return { success: false, error: `Link count exceeds maximum allowed (${MAX_LINKS}).` }
    }

    for (let i = 0; i < rawLinks.length; i++) {
      const l = rawLinks[i]
      if (!l || typeof l !== 'object') {
        return { success: false, error: `Link at index ${i} is not a valid object.` }
      }

      const source = typeof l.source === 'string' ? l.source.trim() : String(l.source ?? '').trim()
      const target = typeof l.target === 'string' ? l.target.trim() : String(l.target ?? '').trim()

      if (!source || !target) {
        return { success: false, error: `Link at index ${i} is missing source or target.` }
      }

      if (source === target) {
        return { success: false, error: `Self-link detected at router "${source}". Self-links are disallowed.` }
      }

      if (!routerIdSet.has(source)) {
        return { success: false, error: `Link references unknown source router: "${source}".` }
      }
      if (!routerIdSet.has(target)) {
        return { success: false, error: `Link references unknown target router: "${target}".` }
      }

      // Check duplicate undirected links
      const pairKey = [source, target].sort().join('::')
      if (edgePairSet.has(pairKey)) {
        return { success: false, error: `Duplicate link detected between "${source}" and "${target}".` }
      }
      edgePairSet.add(pairKey)

      const cost = Number(l.cost)
      if (!Number.isFinite(cost) || cost <= 0) {
        return {
          success: false,
          error: `Link between "${source}" and "${target}" has invalid cost (${l.cost}). Cost must be a positive number.`,
        }
      }

      const enabled = l.enabled !== false
      const edgeId = typeof l.id === 'string' && l.id.trim() ? l.id.trim() : `${source}-${target}`

      validatedEdges.push({
        id: edgeId,
        source,
        target,
        label: String(cost),
        data: {
          cost,
          failed: !enabled,
          enabled,
        },
      })
    }
  }

  const networkName = typeof data.name === 'string' && data.name.trim() ? data.name.trim() : 'Imported Network'

  return {
    success: true,
    network: {
      name: networkName,
      nodes: validatedNodes,
      edges: validatedEdges,
    },
  }
}
