/**
 * dijkstra.test.js
 * Focused unit tests for the Dijkstra algorithm and routing table.
 *
 * Run with: node src/utils/dijkstra.test.js
 * No test framework required — plain Node.js assertions.
 *
 * Test topology (the standard RouteLab initial network):
 *
 *      A ──4── B ──5── D
 *      │       │       │
 *      2       1       2
 *      │       │       │
 *      └──────►C ──8── ┘
 *              │
 *             10
 *              │
 *              E
 *
 * Expected shortest paths from A:
 *   A→B : A→C→B  cost 3
 *   A→C : A→C    cost 2
 *   A→D : A→C→B→D  cost 8
 *   A→E : A→C→B→D→E  cost 10
 */

import { buildGraph }        from './graph.js'
import { runDijkstra, buildRoutingTable } from './dijkstra.js'
import { runBellmanFord, buildRoutingTableBellmanFord } from './bellmanFord.js'
import { validateAndImportNetwork } from './serialization.js'
import { PRESETS } from '../data/networkPresets.js'

// ── Helpers ──────────────────────────────────────────────────────────────────

let passed = 0
let failed = 0

function assert(condition, label) {
  if (condition) {
    console.log(`  ✓  ${label}`)
    passed++
  } else {
    console.error(`  ✗  ${label}`)
    failed++
  }
}

function assertEqual(actual, expected, label) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (ok) {
    console.log(`  ✓  ${label}`)
    passed++
  } else {
    console.error(`  ✗  ${label}`)
    console.error(`     expected: ${JSON.stringify(expected)}`)
    console.error(`     actual:   ${JSON.stringify(actual)}`)
    failed++
  }
}

// ── Build the standard topology ───────────────────────────────────────────────

const stdNodes = [
  { id: 'A' }, { id: 'B' }, { id: 'C' }, { id: 'D' }, { id: 'E' },
]

const stdEdges = [
  { id: 'A-B', source: 'A', target: 'B', data: { cost: 4, failed: false } },
  { id: 'A-C', source: 'A', target: 'C', data: { cost: 2, failed: false } },
  { id: 'B-C', source: 'B', target: 'C', data: { cost: 1, failed: false } },
  { id: 'B-D', source: 'B', target: 'D', data: { cost: 5, failed: false } },
  { id: 'C-D', source: 'C', target: 'D', data: { cost: 8, failed: false } },
  { id: 'C-E', source: 'C', target: 'E', data: { cost: 10, failed: false } },
  { id: 'D-E', source: 'D', target: 'E', data: { cost: 2, failed: false } },
]

const stdGraph = buildGraph(stdNodes, stdEdges)

// ═══════════════════════════════════════════════════════════════════════════
// TEST GROUP 1 — Standard topology shortest paths
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n[ Group 1 ] Standard topology — shortest paths from A')

{
  const r = runDijkstra(stdGraph, 'A', 'E')
  assertEqual(r.path,  ['A','C','B','D','E'], 'A→E path')
  assertEqual(r.cost,  10,                   'A→E cost = 10')
  assertEqual(r.edgeIds, ['A-C','B-C','B-D','D-E'], 'A→E edge IDs')
}

{
  const r = runDijkstra(stdGraph, 'A', 'B')
  assertEqual(r.path,  ['A','C','B'], 'A→B path')
  assertEqual(r.cost,  3,            'A→B cost = 3')
}

{
  const r = runDijkstra(stdGraph, 'A', 'D')
  assertEqual(r.path,  ['A','C','B','D'], 'A→D path')
  assertEqual(r.cost,  8,                'A→D cost = 8')
}

{
  const r = runDijkstra(stdGraph, 'A', 'C')
  assertEqual(r.path,  ['A','C'], 'A→C path')
  assertEqual(r.cost,  2,        'A→C cost = 2')
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST GROUP 2 — Edge cases
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n[ Group 2 ] Edge cases')

{
  // Source = Destination
  const r = runDijkstra(stdGraph, 'B', 'B')
  assertEqual(r.path, ['B'], 'src=dest → single-node path')
  assertEqual(r.cost, 0,    'src=dest → cost 0')
}

{
  // Single-router network
  const g = buildGraph([{ id: 'X' }], [])
  const r = runDijkstra(g, 'X', 'X')
  assertEqual(r.path, ['X'], 'single node → path is [X]')
  assertEqual(r.cost, 0,    'single node → cost 0')
}

{
  // Source not in graph
  const r = runDijkstra(stdGraph, 'Z', 'A')
  assertEqual(r.path, [], 'unknown source → empty path')
  assert(r.cost === Infinity, 'unknown source → cost Infinity')
}

{
  // Disconnected: isolated node F
  const nodes = [...stdNodes, { id: 'F' }]
  const g     = buildGraph(nodes, stdEdges)   // F has no edges
  const r     = runDijkstra(g, 'A', 'F')
  assertEqual(r.path, [], 'disconnected → empty path')
  assert(r.cost === Infinity, 'disconnected → cost Infinity')
}

{
  // Reverse direction (B→A)
  const r = runDijkstra(stdGraph, 'B', 'A')
  assertEqual(r.cost, 3, 'B→A cost = 3 (symmetric)')
  assert(r.path.length > 0, 'B→A has a path')
  assert(r.path[0] === 'B' && r.path[r.path.length - 1] === 'A', 'B→A path endpoints correct')
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST GROUP 3 — Equal-cost paths
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n[ Group 3 ] Equal-cost alternative paths')

{
  // Build a diamond: A→B cost 1, A→C cost 1, B→D cost 1, C→D cost 1
  // Both A→B→D and A→C→D cost 2. Alphabetical tie-break should choose C first.
  const nodes = [{ id: 'A' }, { id: 'B' }, { id: 'C' }, { id: 'D' }]
  const edges = [
    { id: 'A-B', source: 'A', target: 'B', data: { cost: 1 } },
    { id: 'A-C', source: 'A', target: 'C', data: { cost: 1 } },
    { id: 'B-D', source: 'B', target: 'D', data: { cost: 1 } },
    { id: 'C-D', source: 'C', target: 'D', data: { cost: 1 } },
  ]
  const g = buildGraph(nodes, edges)
  const r = runDijkstra(g, 'A', 'D')
  assertEqual(r.cost, 2, 'equal-cost diamond → cost 2')
  assert(r.path.length === 3, 'equal-cost diamond → 3 nodes in path')
  assertEqual(r.path[0], 'A', 'diamond path starts at A')
  assertEqual(r.path[2], 'D', 'diamond path ends at D')
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST GROUP 4 — Routing table
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n[ Group 4 ] Routing table from source A')

{
  const nodeIds = stdNodes.map((n) => n.id)
  const table   = buildRoutingTable(stdGraph, nodeIds, 'A')

  // Sort by destination for deterministic checks
  const byDest = Object.fromEntries(table.map((r) => [r.destination, r]))

  // Source row
  assertEqual(byDest['A'].nextHop, '—', 'A→A next hop is —')
  assertEqual(byDest['A'].cost,    0,   'A→A cost is 0')
  assertEqual(byDest['A'].path,    ['A'], 'A→A path is [A]')

  // A→C (direct)
  assertEqual(byDest['C'].nextHop, 'C',      'A→C next hop is C')
  assertEqual(byDest['C'].cost,    2,         'A→C cost is 2')
  assertEqual(byDest['C'].path,    ['A','C'], 'A→C path correct')

  // A→B (via C)
  assertEqual(byDest['B'].nextHop, 'C',         'A→B next hop is C')
  assertEqual(byDest['B'].cost,    3,            'A→B cost is 3')
  assertEqual(byDest['B'].path,    ['A','C','B'], 'A→B path correct')

  // A→D (via C→B)
  assertEqual(byDest['D'].nextHop, 'C',              'A→D next hop is C')
  assertEqual(byDest['D'].cost,    8,                'A→D cost is 8')
  assertEqual(byDest['D'].path,    ['A','C','B','D'], 'A→D path correct')

  // A→E (via C→B→D)
  assertEqual(byDest['E'].nextHop, 'C',                  'A→E next hop is C')
  assertEqual(byDest['E'].cost,    10,                   'A→E cost is 10')
  assertEqual(byDest['E'].path,    ['A','C','B','D','E'], 'A→E path correct')
}

{
  // Routing table with disconnected node
  const nodes = [...stdNodes, { id: 'F' }]
  const g     = buildGraph(nodes, stdEdges)
  const table = buildRoutingTable(g, nodes.map((n) => n.id), 'A')
  const fRow  = table.find((r) => r.destination === 'F')
  assertEqual(fRow.nextHop, '—',     'disconnected F → next hop —')
  assert(fRow.cost === Infinity,     'disconnected F → cost ∞')
  assertEqual(fRow.path, [],         'disconnected F → empty path')
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST GROUP 5 — Dynamic topology changes
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n[ Group 5 ] Dynamic topology changes')

{
  // After removing B, path A→D should go via C→D (cost 10) instead of A→C→B→D (cost 8)
  const nodesNoB = stdNodes.filter((n) => n.id !== 'B')
  const edgesNoB = stdEdges.filter((e) => e.source !== 'B' && e.target !== 'B')
  const g = buildGraph(nodesNoB, edgesNoB)
  const r = runDijkstra(g, 'A', 'D')
  assertEqual(r.path, ['A','C','D'], 'remove B → A→D via C→D')
  assertEqual(r.cost, 10,           'remove B → A→D cost = 10')
}

{
  // After adding new edge A-D with cost 1, shortest A→D should be direct
  const extraEdge = { id: 'A-D', source: 'A', target: 'D', data: { cost: 1, failed: false } }
  const g = buildGraph(stdNodes, [...stdEdges, extraEdge])
  const r = runDijkstra(g, 'A', 'D')
  assertEqual(r.path, ['A','D'], 'add A-D cost 1 → direct path')
  assertEqual(r.cost, 1,        'add A-D cost 1 → cost 1')
}

{
  // After changing A-C cost to 20, A→B should switch from via-C to direct A-B
  const modifiedEdges = stdEdges.map((e) =>
    e.id === 'A-C' ? { ...e, data: { ...e.data, cost: 20 } } : e
  )
  const g = buildGraph(stdNodes, modifiedEdges)
  const r = runDijkstra(g, 'A', 'B')
  assertEqual(r.path, ['A','B'], 'raise A-C cost → A→B goes direct')
  assertEqual(r.cost, 4,        'raise A-C cost → A→B cost 4')
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST GROUP 6 — Phase 4: Link Failure Simulation & Automatic Rerouting
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n[ Group 6 ] Link Failure Simulation & Automatic Rerouting')

{
  // 1. Initial A→E shortest path cost = 10
  const g = buildGraph(stdNodes, stdEdges)
  const r = runDijkstra(g, 'A', 'E')
  assertEqual(r.path, ['A', 'C', 'B', 'D', 'E'], 'Initial A→E path: A→C→B→D→E')
  assertEqual(r.cost, 10,                        'Initial A→E cost = 10')
}

{
  // 2. Disabling B–D changes A→E route to A→C→E with cost 12
  const edgesWithBDDisabled = stdEdges.map((e) =>
    e.id === 'B-D' ? { ...e, data: { ...e.data, enabled: false } } : e
  )
  const g = buildGraph(stdNodes, edgesWithBDDisabled)
  const r = runDijkstra(g, 'A', 'E')
  assertEqual(r.path, ['A', 'C', 'E'], 'Disabling B-D reroutes A→E to A→C→E')
  assertEqual(r.cost, 12,              'Disabling B-D changes A→E cost to 12')
}

{
  // 3. Restoring B–D restores original shortest path and cost 10
  const edgesRestored = stdEdges.map((e) =>
    e.id === 'B-D' ? { ...e, data: { ...e.data, enabled: true } } : e
  )
  const g = buildGraph(stdNodes, edgesRestored)
  const r = runDijkstra(g, 'A', 'E')
  assertEqual(r.path, ['A', 'C', 'B', 'D', 'E'], 'Restoring B-D restores path: A→C→B→D→E')
  assertEqual(r.cost, 10,                        'Restoring B-D restores cost 10')
}

{
  // 4. Multiple disabled links: disabling both C-E and D-E isolates E completely
  const edgesBothDisabled = stdEdges.map((e) =>
    e.id === 'C-E' || e.id === 'D-E'
      ? { ...e, data: { ...e.data, enabled: false } }
      : e
  )
  const g = buildGraph(stdNodes, edgesBothDisabled)
  const r = runDijkstra(g, 'A', 'E')
  assertEqual(r.path, [],        'Multiple disabled (C-E, D-E) isolates E: empty path')
  assert(r.cost === Infinity,    'Multiple disabled (C-E, D-E) isolates E: cost Infinity')
}

{
  // 5. Unreachable destinations handled correctly in routing table when destination isolated
  const edgesDEDisabled = stdEdges.map((e) =>
    e.id === 'D-E' || e.id === 'C-E'
      ? { ...e, data: { ...e.data, enabled: false } }
      : e
  )
  const g = buildGraph(stdNodes, edgesDEDisabled)
  const table = buildRoutingTable(g, stdNodes.map((n) => n.id), 'A')
  const eRow = table.find((row) => row.destination === 'E')
  assertEqual(eRow.nextHop, '—',  'Isolated E nextHop is —')
  assert(eRow.cost === Infinity,  'Isolated E cost is Infinity')
  assertEqual(eRow.path, [],      'Isolated E path is []')
}

{
  // 6. Disabling unrelated links (e.g. C-D or A-B) does not affect A→E path
  const edgesUnrelatedDisabled = stdEdges.map((e) =>
    e.id === 'C-D' || e.id === 'A-B'
      ? { ...e, data: { ...e.data, enabled: false } }
      : e
  )
  const g = buildGraph(stdNodes, edgesUnrelatedDisabled)
  const r = runDijkstra(g, 'A', 'E')
  assertEqual(r.path, ['A', 'C', 'B', 'D', 'E'], 'Disabling unused links (C-D, A-B) does not change A→E path')
  assertEqual(r.cost, 10,                        'Disabling unused links (C-D, A-B) keeps cost 10')
}

{
  // 7. Routing tables update dynamically when B-D is disabled
  const edgesBDDisabled = stdEdges.map((e) =>
    e.id === 'B-D' ? { ...e, data: { ...e.data, enabled: false } } : e
  )
  const g = buildGraph(stdNodes, edgesBDDisabled)
  const table = buildRoutingTable(g, stdNodes.map((n) => n.id), 'A')
  const byDest = Object.fromEntries(table.map((row) => [row.destination, row]))

  // D must now be reached via C-D (cost 2 + 8 = 10) instead of B-D
  assertEqual(byDest['D'].nextHop, 'C',              'With B-D disabled, D nextHop is C')
  assertEqual(byDest['D'].cost,    10,               'With B-D disabled, D cost is 10')
  assertEqual(byDest['D'].path,    ['A', 'C', 'D'],   'With B-D disabled, D path is A→C→D')

  // E must now be reached via C-E (cost 2 + 10 = 12)
  assertEqual(byDest['E'].nextHop, 'C',              'With B-D disabled, E nextHop is C')
  assertEqual(byDest['E'].cost,    12,               'With B-D disabled, E cost is 12')
  assertEqual(byDest['E'].path,    ['A', 'C', 'E'],   'With B-D disabled, E path is A→C→E')
}

{
  // 8. Reset Network restores the original graph
  const g = buildGraph(stdNodes, stdEdges)
  const r = runDijkstra(g, 'A', 'E')
  assertEqual(r.path, ['A', 'C', 'B', 'D', 'E'], 'Reset restores original topology: path A→C→B→D→E')
  assertEqual(r.cost, 10,                        'Reset restores original topology: cost 10')
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST GROUP 7 — RouteLab 2.0: Network Presets & Alternative Topologies
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n[ Group 7 ] RouteLab 2.0: Presets & Alternative Topologies')

{
  // 1. Ring Network Preset verification
  // Clockwise A→D vs Counter-clockwise A→D
  const ringNodes = [
    { id: 'A' }, { id: 'B' }, { id: 'C' }, { id: 'D' }, { id: 'E' }, { id: 'F' },
  ]
  const ringEdges = [
    { id: 'A-B', source: 'A', target: 'B', data: { cost: 3, failed: false, enabled: true } },
    { id: 'B-C', source: 'B', target: 'C', data: { cost: 4, failed: false, enabled: true } },
    { id: 'C-D', source: 'C', target: 'D', data: { cost: 2, failed: false, enabled: true } },
    { id: 'D-E', source: 'D', target: 'E', data: { cost: 5, failed: false, enabled: true } },
    { id: 'E-F', source: 'E', target: 'F', data: { cost: 3, failed: false, enabled: true } },
    { id: 'F-A', source: 'F', target: 'A', data: { cost: 4, failed: false, enabled: true } },
  ]
  const g = buildGraph(ringNodes, ringEdges)
  const r = runDijkstra(g, 'A', 'D')
  assertEqual(r.path, ['A', 'B', 'C', 'D'], 'Ring Network: A→D prefers clockwise path A→B→C→D')
  assertEqual(r.cost, 9,                   'Ring Network: A→D clockwise cost = 9')

  // When B-C is disabled in Ring, it must reroute counter-clockwise
  const ringCutEdges = ringEdges.map((e) =>
    e.id === 'B-C' ? { ...e, data: { ...e.data, enabled: false } } : e
  )
  const gCut = buildGraph(ringNodes, ringCutEdges)
  const rCut = runDijkstra(gCut, 'A', 'D')
  assertEqual(rCut.path, ['A', 'F', 'E', 'D'], 'Ring Network: with B-C down, reroutes counter-clockwise A→F→E→D')
  assertEqual(rCut.cost, 12,                   'Ring Network: counter-clockwise cost = 12')
}

{
  // 2. Campus Network Preset verification
  const campusNodes = [
    { id: 'Admin' }, { id: 'Academic' }, { id: 'Lab' }, { id: 'Library' }, { id: 'Hostel' },
  ]
  const campusEdges = [
    { id: 'Admin-Academic',   source: 'Admin',    target: 'Academic', data: { cost: 2, failed: false, enabled: true } },
    { id: 'Admin-Library',    source: 'Admin',    target: 'Library',  data: { cost: 4, failed: false, enabled: true } },
    { id: 'Academic-Lab',     source: 'Academic', target: 'Lab',      data: { cost: 1, failed: false, enabled: true } },
    { id: 'Academic-Library', source: 'Academic', target: 'Library',  data: { cost: 3, failed: false, enabled: true } },
    { id: 'Library-Hostel',   source: 'Library',  target: 'Hostel',   data: { cost: 5, failed: false, enabled: true } },
    { id: 'Lab-Hostel',       source: 'Lab',      target: 'Hostel',   data: { cost: 7, failed: false, enabled: true } },
    { id: 'Admin-Hostel',     source: 'Admin',    target: 'Hostel',   data: { cost: 9, failed: false, enabled: true } },
  ]
  const g = buildGraph(campusNodes, campusEdges)
  const r = runDijkstra(g, 'Admin', 'Hostel')
  assertEqual(r.cost, 9, 'Campus Network: optimal Admin→Hostel cost = 9')

  // Shortest path from Admin to Lab: Admin → Academic → Lab (cost 2 + 1 = 3)
  const rLab = runDijkstra(g, 'Admin', 'Lab')
  assertEqual(rLab.path, ['Admin', 'Academic', 'Lab'], 'Campus Network: Admin→Lab via Academic')
  assertEqual(rLab.cost, 3,                            'Campus Network: Admin→Lab cost = 3')
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST GROUP 8: Dijkstra Step-by-Step Tracing (Phase 7)
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n--- Group 8: Dijkstra Step Tracing ---')

{
  const g = buildGraph(stdNodes, stdEdges)
  const res = runDijkstra(g, 'A', 'D')

  assert(Array.isArray(res.steps), 'runDijkstra returns steps array')
  assert(res.steps.length > 0,     'steps array is not empty')

  // Step 0 check
  const step0 = res.steps[0]
  assertEqual(step0.stepNumber, 0, 'Step 0: stepNumber is 0')
  assertEqual(step0.currentNode, 'Init', 'Step 0: currentNode is Init')
  assertEqual(step0.visitedNodes, [], 'Step 0: visitedNodes is empty')
  assertEqual(step0.distances['A'], 0, 'Step 0: distance to source A is 0')
  assertEqual(step0.distances['B'], Infinity, 'Step 0: tentative distance to B is Infinity')
  assertEqual(step0.predecessors['A'], null, 'Step 0: predecessor to A is null')

  // Step 1 check (A is settled, relaxes neighbors B and C)
  const step1 = res.steps[1]
  assertEqual(step1.stepNumber, 1, 'Step 1: stepNumber is 1')
  assertEqual(step1.currentNode, 'A', 'Step 1: selects router A')
  assert(step1.visitedNodes.includes('A'), 'Step 1: visitedNodes includes A')
  assertEqual(step1.distances['C'], 2, 'Step 1: relaxes C to cost 2')
  assertEqual(step1.distances['B'], 4, 'Step 1: relaxes B to cost 4')

  // Step 2 check (C with cost 2 is settled, relaxes B to 3, E to 12)
  const step2 = res.steps[2]
  assertEqual(step2.currentNode, 'C', 'Step 2: selects router C (cost 2)')
  assert(step2.visitedNodes.includes('C'), 'Step 2: visitedNodes includes C')
  assertEqual(step2.distances['B'], 3, 'Step 2: relaxes B to 3 via C')
  assertEqual(step2.predecessors['B'], 'C', 'Step 2: predecessor of B is now C')

  // Immutability: Verify step snapshots are isolated copies
  step0.distances['A'] = 999
  assert(res.steps[1].distances['A'] === 0, 'Step snapshots are isolated and immutable')

  // Single node step tracing
  const singleG = buildGraph([{ id: 'X' }], [])
  const singleRes = runDijkstra(singleG, 'X', 'X')
  assert(singleRes.steps.length === 1, 'Single router: has 1 step (source == destination)')
  assertEqual(singleRes.steps[0].currentNode, 'X', 'Single router settled')
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST GROUP 9: Bellman-Ford Routing Algorithm (Phase 7)
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n--- Group 9: Bellman-Ford Routing Algorithm ---')

{
  const g = buildGraph(stdNodes, stdEdges)

  // Test standard pairs against Dijkstra
  const pairs = [
    { src: 'A', dst: 'B', expPath: ['A', 'C', 'B'], expCost: 3 },
    { src: 'A', dst: 'C', expPath: ['A', 'C'], expCost: 2 },
    { src: 'A', dst: 'D', expPath: ['A', 'C', 'B', 'D'], expCost: 8 },
    { src: 'A', dst: 'E', expPath: ['A', 'C', 'B', 'D', 'E'], expCost: 10 },
  ]

  for (const { src, dst, expPath, expCost } of pairs) {
    const bfRes = runBellmanFord(g, src, dst)
    const djRes = runDijkstra(g, src, dst)

    assertEqual(bfRes.cost, expCost, `Bellman-Ford: ${src}→${dst} cost is ${expCost}`)
    assertEqual(bfRes.cost, djRes.cost, `Bellman-Ford & Dijkstra costs match for ${src}→${dst}`)
    assertEqual(bfRes.path, expPath, `Bellman-Ford: ${src}→${dst} path matches expected`)
  }

  // Source equals destination
  const selfRes = runBellmanFord(g, 'B', 'B')
  assertEqual(selfRes.path, ['B'], 'Bellman-Ford: Source == Destination path is [B]')
  assertEqual(selfRes.cost, 0,   'Bellman-Ford: Source == Destination cost is 0')

  // Unreachable router
  const disconnectedEdges = stdEdges.filter((e) => !e.id.includes('E'))
  const discG = buildGraph(stdNodes, disconnectedEdges)
  const unreachRes = runBellmanFord(discG, 'A', 'E')
  assertEqual(unreachRes.path, [],        'Bellman-Ford: Unreachable router path is []')
  assertEqual(unreachRes.cost, Infinity,  'Bellman-Ford: Unreachable router cost is Infinity')

  // Routing table via Bellman-Ford
  const table = buildRoutingTableBellmanFord(g, ['A', 'B', 'C', 'D', 'E'], 'A')
  assertEqual(table.length, 5, 'Bellman-Ford Routing Table: has 5 entries')
  const rowB = table.find((r) => r.destination === 'B')
  assertEqual(rowB.nextHop, 'C', 'Bellman-Ford Routing Table: A→B next hop is C')
  assertEqual(rowB.cost, 3,      'Bellman-Ford Routing Table: A→B cost is 3')

  // Bellman-Ford across Preset 2: Ring Network
  const ringNodes = [
    { id: 'A' }, { id: 'B' }, { id: 'C' }, { id: 'D' }, { id: 'E' }, { id: 'F' },
  ]
  const ringEdges = [
    { id: 'A-B', source: 'A', target: 'B', data: { cost: 3, failed: false, enabled: true } },
    { id: 'B-C', source: 'B', target: 'C', data: { cost: 4, failed: false, enabled: true } },
    { id: 'C-D', source: 'C', target: 'D', data: { cost: 2, failed: false, enabled: true } },
    { id: 'D-E', source: 'D', target: 'E', data: { cost: 5, failed: false, enabled: true } },
    { id: 'E-F', source: 'E', target: 'F', data: { cost: 3, failed: false, enabled: true } },
    { id: 'F-A', source: 'F', target: 'A', data: { cost: 4, failed: false, enabled: true } },
  ]
  const ringG = buildGraph(ringNodes, ringEdges)
  const bfRing = runBellmanFord(ringG, 'A', 'D')
  const djRing = runDijkstra(ringG, 'A', 'D')
  assertEqual(bfRing.cost, 9, 'Bellman-Ford Ring Network: A→D cost is 9')
  assertEqual(bfRing.cost, djRing.cost, 'Bellman-Ford matches Dijkstra cost on Ring Network')
  assertEqual(bfRing.path, ['A', 'B', 'C', 'D'], 'Bellman-Ford Ring Network: path is clockwise A→B→C→D')

  // Ring Network with failure (B-C down)
  const ringCutEdges = ringEdges.map((e) =>
    e.id === 'B-C' ? { ...e, data: { ...e.data, enabled: false } } : e
  )
  const ringCutG = buildGraph(ringNodes, ringCutEdges)
  const bfRingCut = runBellmanFord(ringCutG, 'A', 'D')
  const djRingCut = runDijkstra(ringCutG, 'A', 'D')
  assertEqual(bfRingCut.cost, 12, 'Bellman-Ford Ring Network (reroute): cost is 12')
  assertEqual(bfRingCut.cost, djRingCut.cost, 'Bellman-Ford matches Dijkstra on Ring reroute')
  assertEqual(bfRingCut.path, ['A', 'F', 'E', 'D'], 'Bellman-Ford Ring Network: path is counter-clockwise')

  // Bellman-Ford across Preset 3: Campus Network
  const campusNodes = [
    { id: 'Admin' }, { id: 'Academic' }, { id: 'Lab' }, { id: 'Library' }, { id: 'Hostel' },
  ]
  const campusEdges = [
    { id: 'Admin-Academic',   source: 'Admin',    target: 'Academic', data: { cost: 2, failed: false, enabled: true } },
    { id: 'Admin-Library',    source: 'Admin',    target: 'Library',  data: { cost: 4, failed: false, enabled: true } },
    { id: 'Academic-Lab',     source: 'Academic', target: 'Lab',      data: { cost: 1, failed: false, enabled: true } },
    { id: 'Academic-Library', source: 'Academic', target: 'Library',  data: { cost: 3, failed: false, enabled: true } },
    { id: 'Library-Hostel',   source: 'Library',  target: 'Hostel',   data: { cost: 5, failed: false, enabled: true } },
    { id: 'Lab-Hostel',       source: 'Lab',      target: 'Hostel',   data: { cost: 7, failed: false, enabled: true } },
    { id: 'Admin-Hostel',     source: 'Admin',    target: 'Hostel',   data: { cost: 9, failed: false, enabled: true } },
  ]
  const campusG = buildGraph(campusNodes, campusEdges)
  const bfCampus = runBellmanFord(campusG, 'Admin', 'Hostel')
  const djCampus = runDijkstra(campusG, 'Admin', 'Hostel')
  assertEqual(bfCampus.cost, 9, 'Bellman-Ford Campus Network: Admin→Hostel cost is 9')
  assertEqual(bfCampus.cost, djCampus.cost, 'Bellman-Ford matches Dijkstra on Campus Network')

  // Bellman-Ford across Custom Graph: Linear Chain
  const chainNodes = [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }]
  const chainEdges = [
    { id: '1-2', source: '1', target: '2', data: { cost: 10 } },
    { id: '2-3', source: '2', target: '3', data: { cost: 20 } },
    { id: '3-4', source: '3', target: '4', data: { cost: 30 } },
  ]
  const chainG = buildGraph(chainNodes, chainEdges)
  const bfChain = runBellmanFord(chainG, '1', '4')
  const djChain = runDijkstra(chainG, '1', '4')
  assertEqual(bfChain.cost, 60, 'Bellman-Ford Linear Chain: cost is 60')
  assertEqual(bfChain.cost, djChain.cost, 'Bellman-Ford matches Dijkstra on Linear Chain')
  assertEqual(bfChain.path, ['1', '2', '3', '4'], 'Bellman-Ford Linear Chain: path is 1→2→3→4')

  // Bellman-Ford across Custom Graph: Complete Mesh
  const meshNodes = [{ id: 'M1' }, { id: 'M2' }, { id: 'M3' }, { id: 'M4' }]
  const meshEdges = [
    { id: 'M1-M2', source: 'M1', target: 'M2', data: { cost: 10 } },
    { id: 'M1-M3', source: 'M1', target: 'M3', data: { cost: 3 } },
    { id: 'M3-M2', source: 'M3', target: 'M2', data: { cost: 2 } }, // M1→M3→M2 = 5 < 10
    { id: 'M2-M4', source: 'M2', target: 'M4', data: { cost: 4 } }, // M1→M3→M2→M4 = 9
    { id: 'M3-M4', source: 'M3', target: 'M4', data: { cost: 8 } },
    { id: 'M1-M4', source: 'M1', target: 'M4', data: { cost: 15 } },
  ]
  const meshG = buildGraph(meshNodes, meshEdges)
  const bfMesh = runBellmanFord(meshG, 'M1', 'M4')
  const djMesh = runDijkstra(meshG, 'M1', 'M4')
  assertEqual(bfMesh.cost, 9, 'Bellman-Ford Mesh: optimal cost is 9')
  assertEqual(bfMesh.cost, djMesh.cost, 'Bellman-Ford matches Dijkstra on Mesh')
  assertEqual(bfMesh.path, ['M1', 'M3', 'M2', 'M4'], 'Bellman-Ford Mesh: path is M1→M3→M2→M4')
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST GROUP 10: JSON Serialization & Network Import Validation (Phase 7)
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n--- Group 10: JSON Serialization & Network Import Validation ---')

{
  // Valid export & import
  const validJson = JSON.stringify({
    schemaVersion: 1,
    name: 'Custom Test Network',
    nodes: [
      { id: 'R1', label: 'R1', x: 100, y: 150 },
      { id: 'R2', label: 'R2', x: 300, y: 150 }
    ],
    edges: [
      { id: 'R1-R2', source: 'R1', target: 'R2', cost: 7, enabled: true }
    ]
  })

  const importRes = validateAndImportNetwork(validJson)
  assert(importRes.success, 'Valid JSON network imports successfully')
  assertEqual(importRes.network.nodes.length, 2, 'Imported network has 2 nodes')
  assertEqual(importRes.network.edges.length, 1, 'Imported network has 1 edge')
  assertEqual(importRes.network.edges[0].data.cost, 7, 'Imported edge cost is 7')

  // Validation: Malformed JSON syntax
  const badSyntax = validateAndImportNetwork('{ invalid json }')
  assert(!badSyntax.success, 'Rejects invalid JSON syntax')
  assert(badSyntax.error.includes('valid JSON'), 'Reports JSON syntax error')

  // Validation: Unsupported schema version
  const badSchema = validateAndImportNetwork(JSON.stringify({ schemaVersion: 2, nodes: [], edges: [] }))
  assert(!badSchema.success, 'Rejects unsupported schema version')

  // Validation: Duplicate router IDs
  const dupNodes = validateAndImportNetwork(JSON.stringify({
    schemaVersion: 1,
    nodes: [{ id: 'A' }, { id: 'A' }],
    edges: []
  }))
  assert(!dupNodes.success, 'Rejects duplicate router IDs')

  // Validation: Self-loop link
  const selfLink = validateAndImportNetwork(JSON.stringify({
    schemaVersion: 1,
    nodes: [{ id: 'A' }],
    edges: [{ source: 'A', target: 'A', cost: 5 }]
  }))
  assert(!selfLink.success, 'Rejects self-loop link')

  // Validation: Unknown endpoint
  const unknownEndpoint = validateAndImportNetwork(JSON.stringify({
    schemaVersion: 1,
    nodes: [{ id: 'A' }],
    edges: [{ source: 'A', target: 'Z', cost: 5 }]
  }))
  assert(!unknownEndpoint.success, 'Rejects link referencing unknown router')

  // Validation: Non-positive edge cost
  const negativeCost = validateAndImportNetwork(JSON.stringify({
    schemaVersion: 1,
    nodes: [{ id: 'A' }, { id: 'B' }],
    edges: [{ source: 'A', target: 'B', cost: -3 }]
  }))
  assert(!negativeCost.success, 'Rejects non-positive link cost')

  // Validation: Duplicate link between same pair
  const duplicateEdge = validateAndImportNetwork(JSON.stringify({
    schemaVersion: 1,
    nodes: [{ id: 'A' }, { id: 'B' }],
    edges: [
      { source: 'A', target: 'B', cost: 4 },
      { source: 'B', target: 'A', cost: 6 }
    ]
  }))
  assert(!duplicateEdge.success, 'Rejects duplicate link between same router pair')

  // Validation: End-to-end import with disabled links and shortest path execution
  const complexImportJson = JSON.stringify({
    schemaVersion: 1,
    name: 'Imported Failover Test',
    nodes: [
      { id: 'X1', label: 'Router X1', position: { x: 120, y: 180 } },
      { id: 'X2', label: 'Router X2', position: { x: 260, y: 180 } },
      { id: 'X3', label: 'Router X3', position: { x: 400, y: 180 } },
    ],
    edges: [
      { id: 'X1-X2', source: 'X1', target: 'X2', cost: 5, enabled: false }, // Disabled!
      { id: 'X2-X3', source: 'X2', target: 'X3', cost: 5, enabled: true },
      { id: 'X1-X3', source: 'X1', target: 'X3', cost: 15, enabled: true }, // Backup link
    ]
  })
  const complexImport = validateAndImportNetwork(complexImportJson)
  assert(complexImport.success, 'Imports network with disabled link')
  assertEqual(complexImport.network.nodes.length, 3, 'Imported 3 nodes with exact IDs')
  assertEqual(complexImport.network.nodes[0].position, { x: 120, y: 180 }, 'Restores exact position')
  const disabledEdge = complexImport.network.edges.find((e) => e.id === 'X1-X2')
  assertEqual(disabledEdge.data.enabled, false, 'Preserves disabled state on X1-X2')
  assertEqual(disabledEdge.data.failed, true, 'Flags failed property on X1-X2')

  // Execute shortest path on imported network
  const importedGraph = buildGraph(complexImport.network.nodes, complexImport.network.edges)
  const importedDijkstra = runDijkstra(importedGraph, 'X1', 'X3')
  assertEqual(importedDijkstra.cost, 15, 'Imported network routes via backup link X1-X3 (cost 15)')
  assertEqual(importedDijkstra.path, ['X1', 'X3'], 'Imported network shortest path is [X1, X3]')

  const importedBellmanFord = runBellmanFord(importedGraph, 'X1', 'X3')
  assertEqual(importedBellmanFord.cost, 15, 'Bellman-Ford matches Dijkstra on imported network')
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST GROUP 11: RouteLab 2.1 — Custom Network Design & Interactive Simulation
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n--- Group 11: RouteLab 2.1 Custom Network Design & Simulation ---')

{
  // 1. Empty Custom Network
  const emptyGraph = buildGraph([], [])
  assertEqual(emptyGraph.size, 0, 'Empty custom network builds graph with 0 nodes')
  const emptyImportJson = JSON.stringify({
    schemaVersion: 1,
    name: 'Empty Workspace',
    nodes: [],
    edges: [],
  })
  const emptyImport = validateAndImportNetwork(emptyImportJson)
  assert(emptyImport.success, 'Valid empty custom network imports successfully')
  assertEqual(emptyImport.network.nodes.length, 0, 'Empty custom network has 0 nodes')
  assertEqual(emptyImport.network.edges.length, 0, 'Empty custom network has 0 edges')

  // 2. Building a Custom 3-Router Network
  const customNodes = [
    { id: 'R1', type: 'routerNode', position: { x: 100, y: 150 }, data: { label: 'Gateway' } },
    { id: 'R2', type: 'routerNode', position: { x: 300, y: 150 }, data: { label: 'Switch' } },
    { id: 'R3', type: 'routerNode', position: { x: 500, y: 150 }, data: { label: 'Server' } },
  ]

  // Rename Router Validation: duplicate label checking
  function validateRename(nodes, targetId, newLabel) {
    const trimmed = (newLabel || '').trim()
    if (!trimmed) return 'Display label cannot be empty.'
    const isDup = nodes.some(
      (n) => n.id !== targetId && (
        (n.data?.label || '').toLowerCase() === trimmed.toLowerCase() ||
        n.id.toLowerCase() === trimmed.toLowerCase()
      )
    )
    if (isDup) return `A router with name "${trimmed}" already exists.`
    return null
  }

  assertEqual(
    validateRename(customNodes, 'R2', 'Gateway'),
    'A router with name "Gateway" already exists.',
    'Prevents renaming router to existing label "Gateway"'
  )
  assertEqual(
    validateRename(customNodes, 'R2', 'R1'),
    'A router with name "R1" already exists.',
    'Prevents renaming router to existing ID "R1"'
  )
  assertEqual(
    validateRename(customNodes, 'R2', 'Core-Switch'),
    null,
    'Allows unique new label "Core-Switch"'
  )

  // Apply rename while preserving stable internal ID 'R2'
  customNodes[1] = { ...customNodes[1], data: { label: 'Core-Switch' } }
  assertEqual(customNodes[1].id, 'R2', 'Preserves stable internal ID "R2" after rename')
  assertEqual(customNodes[1].data.label, 'Core-Switch', 'Updates display label to "Core-Switch"')

  // 3. Connect Routers with Weighted Links
  const customEdges = [
    { id: 'R1-R2', source: 'R1', target: 'R2', label: '4', data: { cost: 4, enabled: true, failed: false } },
    { id: 'R2-R3', source: 'R2', target: 'R3', label: '3', data: { cost: 3, enabled: true, failed: false } },
    { id: 'R1-R3', source: 'R1', target: 'R3', label: '10', data: { cost: 10, enabled: true, failed: false } },
  ]

  const customGraph = buildGraph(customNodes, customEdges)
  assertEqual(customGraph.size, 3, 'Custom graph has 3 nodes')
  assertEqual(customGraph.get('R1').length, 2, 'R1 has 2 neighbors')

  // 4 & 5. Shortest Path & Dijkstra / Bellman-Ford Parity
  const dCustom = runDijkstra(customGraph, 'R1', 'R3')
  assertEqual(dCustom.cost, 7, 'Dijkstra optimal cost on custom network is 7 (4 + 3)')
  assertEqual(dCustom.path, ['R1', 'R2', 'R3'], 'Dijkstra optimal path is R1 → R2 → R3')

  const bCustom = runBellmanFord(customGraph, 'R1', 'R3')
  assertEqual(bCustom.cost, 7, 'Bellman-Ford matches Dijkstra cost 7 on custom network')
  assertEqual(bCustom.path, ['R1', 'R2', 'R3'], 'Bellman-Ford matches Dijkstra path on custom network')

  // 6. Link Failure Simulation & Automatic Rerouting on Custom Network
  const failEdges = customEdges.map((e) =>
    e.id === 'R1-R2' ? { ...e, data: { ...e.data, enabled: false, failed: true } } : e
  )
  const failGraph = buildGraph(customNodes, failEdges)
  const dReroute = runDijkstra(failGraph, 'R1', 'R3')
  assertEqual(dReroute.cost, 10, 'With R1-R2 disabled, Dijkstra reroutes via R1-R3 (cost 10)')
  assertEqual(dReroute.path, ['R1', 'R3'], 'Dijkstra rerouted path is [R1, R3]')

  const bReroute = runBellmanFord(failGraph, 'R1', 'R3')
  assertEqual(bReroute.cost, 10, 'Bellman-Ford matches Dijkstra rerouted cost 10')
  assertEqual(bReroute.path, ['R1', 'R3'], 'Bellman-Ford matches Dijkstra rerouted path [R1, R3]')

  // 7. Custom Topology Serialization & Round-Trip Persistence
  const exportedCustomJson = JSON.stringify({
    schemaVersion: 1,
    name: 'Custom LAN Topology',
    routers: customNodes.map((n) => ({
      id: n.id,
      label: n.data.label,
      position: n.position,
    })),
    links: failEdges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      cost: e.data.cost,
      enabled: e.data.enabled,
    })),
  })

  const importedCustom = validateAndImportNetwork(exportedCustomJson)
  assert(importedCustom.success, 'Custom network exports and imports successfully')
  assertEqual(importedCustom.network.name, 'Custom LAN Topology', 'Preserves custom network name')
  assertEqual(importedCustom.network.nodes[1].data.label, 'Core-Switch', 'Preserves renamed router display label')
  assertEqual(importedCustom.network.edges.find((e) => e.id === 'R1-R2').data.enabled, false, 'Preserves disabled state on exported link')

  // 8. Interactive Packet Mode (Canvas Selection State Machine)
  function simulateCanvasSelect() {
    let mode = 'idle'
    let step = 'source'
    let src = null
    let dst = null
    let calculated = false

    function toggleMode() {
      if (mode === 'idle') {
        mode = 'selecting'
        step = 'source'
      } else {
        mode = 'idle'
        step = 'source'
      }
    }

    function clickNode(nodeId) {
      if (mode !== 'selecting') return false
      if (step === 'source') {
        src = nodeId
        step = 'destination'
        return true
      }
      if (step === 'destination') {
        if (nodeId === src) return false // Ignore click on same node
        dst = nodeId
        mode = 'idle'
        step = 'source'
        calculated = true
        return true
      }
      return false
    }

    return { toggleMode, clickNode, getState: () => ({ mode, step, src, dst, calculated }) }
  }

  const picker = simulateCanvasSelect()
  picker.toggleMode()
  assertEqual(picker.getState().mode, 'selecting', 'Canvas select mode enters selecting state')
  assertEqual(picker.getState().step, 'source', 'First step is source selection')

  picker.clickNode('R1')
  assertEqual(picker.getState().src, 'R1', 'First click sets source to R1')
  assertEqual(picker.getState().step, 'destination', 'Advances to destination step')

  // Clicking source again does not advance
  const sameNodeClick = picker.clickNode('R1')
  assert(!sameNodeClick, 'Ignores destination click matching source')
  assertEqual(picker.getState().dst, null, 'Destination remains unset')

  picker.clickNode('R3')
  assertEqual(picker.getState().dst, 'R3', 'Second click sets destination to R3')
  assertEqual(picker.getState().mode, 'idle', 'Exits canvas select mode after destination selection')
  assert(picker.getState().calculated, 'Triggers automatic path calculation on endpoint selection')

  // 9. Simulation Event Log Manager
  function createEventLogManager(maxCapacity = 50) {
    let log = []
    function addEvent(description, type = 'info') {
      const now = new Date()
      const timestamp = '12:00:00'
      const id = `${Date.now()}-${Math.random()}`
      log = [{ id, timestamp, description, type }, ...log].slice(0, maxCapacity)
    }
    function clearLog() {
      log = []
    }
    return { addEvent, clearLog, getLog: () => log }
  }

  const logMgr = createEventLogManager(5)
  logMgr.addEvent('Custom network created', 'info')
  logMgr.addEvent('Router R1 added', 'info')
  logMgr.addEvent('Link R1-R2 added', 'info')
  assertEqual(logMgr.getLog().length, 3, 'Event log records 3 events')
  assertEqual(logMgr.getLog()[0].description, 'Link R1-R2 added', 'Newest event is at top (index 0)')

  // Capping capacity at 5
  logMgr.addEvent('Shortest path calculated', 'success')
  logMgr.addEvent('Packet transmitted', 'info')
  logMgr.addEvent('Packet delivered', 'success')
  assertEqual(logMgr.getLog().length, 5, 'Event log caps entries at maximum capacity')
  assertEqual(logMgr.getLog()[0].description, 'Packet delivered', 'Latest event is index 0')

  logMgr.clearLog()
  assertEqual(logMgr.getLog().length, 0, 'Clear Log empties the event history')

  // 10. Regression Check on Presets
  const stdGraph = buildGraph(PRESETS.basic.nodes, PRESETS.basic.edges)
  assertEqual(runDijkstra(stdGraph, 'A', 'E').cost, 10, 'Basic preset A→E cost 10 intact')
  assertEqual(runBellmanFord(stdGraph, 'A', 'E').cost, 10, 'Basic preset Bellman-Ford cost 10 intact')

  const ringGraph = buildGraph(PRESETS.ring.nodes, PRESETS.ring.edges)
  assertEqual(runDijkstra(ringGraph, 'A', 'D').cost, 9, 'Ring preset A→D cost 9 intact')

  const campusGraph = buildGraph(PRESETS.campus.nodes, PRESETS.campus.edges)
  assertEqual(runDijkstra(campusGraph, 'Admin', 'Hostel').cost, 9, 'Campus preset Admin→Hostel cost 9 intact')
}

// ═══════════════════════════════════════════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════════════════════════════════════════
console.log(`\n${'─'.repeat(50)}`)
console.log(`Results: ${passed} passed, ${failed} failed`)
if (failed === 0) {
  console.log('All tests passed ✓')
} else {
  console.error(`${failed} test(s) FAILED`)
  process.exit(1)
}
