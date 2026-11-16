# RouteLab 2.1 — Custom Network Design & Interactive Simulation

A clean, interactive Computer Networks educational laboratory tool built with React and React Flow to visualize network topologies, design custom networks from a blank canvas, calculate shortest paths using Dijkstra's and Bellman-Ford algorithms, inspect dynamic routing tables, simulate physical link failures with automatic rerouting, observe packet journeys, and review real-time simulation event logs.

---

## 1. Introduction

In computer networking, routing is the process of selecting paths across a network to deliver data packets from a source host to a destination host. Interior Gateway Protocols (IGPs) such as Open Shortest Path First (OSPF) rely on graph-theoretic shortest-path algorithms to determine the most cost-effective path between routers.

**RouteLab 2.1** is an educational simulation developed as a university Computer Networks mini-project. It enables students, teachers, and networking enthusiasts to:
1. Construct custom network topologies from a completely blank canvas or explore pre-configured scenarios (Basic, Ring, and Campus topologies).
2. Assign link metrics (costs), rename routers with human-readable display labels, and freely position nodes.
3. Select endpoints visually using **Interactive Packet Mode (Select on Canvas)**.
4. Run Dijkstra's algorithm step-by-step or compare it directly against the Bellman-Ford algorithm.
5. Inspect dynamically generated routing tables for individual routers.
6. Simulate physical link failures with instant automatic failover.
7. Visualize hop-by-hop packet transmission and inspect real-time chronological records in the **Simulation Event Log**.
8. Export and import entire custom networks as portable JSON files.

> **Academic Note on Scope & Routing Protocols**: RouteLab simulates graph-based shortest path routing (Dijkstra's link-state approach as used in OSPF, and Bellman-Ford's distance-vector approach as associated with RIP). It runs purely client-side in the browser and does not simulate actual distributed network message exchanges (such as OSPF LSA flooding, RIP routing update packets, or BGP path-vector peering messages). Furthermore, the **Simulation Event Log** records application-level simulator events (e.g., topology edits, route calculations, animation milestones), and should not be confused with raw Layer 2/3 packet captures (such as Wireshark PCAP traces).

---

## 2. Key Features

### RouteLab 2.1 Upgrades
- **Custom Topology Builder**:
  - Start from an empty workspace via **New Network** (or dropdown option).
  - Clear previous routers, links, endpoints, and animation states with safe confirmation warning.
  - Informative empty-state canvas display: *"Your network is empty. Add a router from the left sidebar to get started."*
- **Router Display Label Renaming**:
  - Rename any router inside the Selected Router properties panel.
  - Enforces duplicate name prevention while preserving stable internal node IDs.
  - Supports 2–20+ routers comfortably with custom names (e.g. `Gateway`, `Core-Switch`, `Server`).
- **Interactive Packet Mode ("Select on Canvas")**:
  - One-click endpoint selection directly on the React Flow canvas.
  - Step 1 selects Source; Step 2 selects Destination.
  - Automatically calculates the optimal shortest path upon selecting the destination without requiring extra clicks.
  - Preserves traditional dropdown selectors as an alternative.
- **Simulation Event Log**:
  - Collapsible real-time chronological log panel in the Results area.
  - Records meaningful events: Network creation, router addition/removal/rename, link addition/deletion/cost edit, link failure/restoration, route calculations, and packet dispatch/delivery/cancellation.
  - Chronological newest-first ordering, capped at 50 events, with a one-click **Clear Log** action.
- **Topology JSON Persistence**:
  - Export and import custom networks with network names, router IDs, display labels, coordinates, link metrics, and disabled states.

### Core Simulation Capabilities
- **Dual Routing Engines**: Dijkstra's Algorithm (Link-State / OSPF model) and Bellman-Ford Algorithm (Distance-Vector / RIP model).
- **Dijkstra Step-by-Step Explorer**: Inspect settled nodes, tentative distance vectors, and predecessors step by step with purple canvas active-step highlighting.
- **Algorithm Comparison Table**: Side-by-side complexity, protocol context, and design principle matrix.
- **Packet Journey Animation**: Smooth `requestAnimationFrame`-driven packet marker traversing multi-hop routes with dynamic amber active-hop highlighting and live progress tracking.
- **Link Failure Simulation & Dynamic Rerouting**: Toggle links inactive (dashed red stroke) and watch optimal backup routes compute instantly.
- **Dynamic Routing Table**: Real-time generation of routing tables (Destination, Next Hop, Cost, Path) for any source router.
- **Zero Backend / Zero Database**: Pure client-side React 19 + Vite 6 + React Flow application.

---

## 3. Technology Stack

- **React 19**: Component state management and reactive updates.
- **Vite 6**: Fast development server and optimized ES production bundler.
- **@xyflow/react (React Flow 12)**: Node-based canvas rendering, custom node types, edge rendering, and canvas viewport controls.
- **Lucide React**: Crisp, minimal UI iconography.
- **Plain CSS**: Clean, accessible stylesheet using CSS variables, standard typography (Inter / system fonts), and a lab-inspired color palette.

---

## 4. Automated Test Suite

RouteLab 2.1 includes a comprehensive test suite with **190 automated tests** passing with 0 failures:

```
Results: 190 passed, 0 failed
Test Suites: 1 passed, 1 total
Tests: 190 passed, 190 total
All tests passed ✓
```

**Test Coverage Breakdown**:
1. Group 1: Standard topology shortest paths from A (9 tests)
2. Group 2: Edge cases, single nodes, unreachable vertices, symmetric costs (11 tests)
3. Group 3: Equal-cost alternative path resolution (4 tests)
4. Group 4: Routing table computation for all destinations (18 tests)
5. Group 5: Dynamic topology modifications (6 tests)
6. Group 6: Link failure simulation, isolation, and automatic rerouting (20 tests)
7. Group 7: RouteLab 2.0 presets — Ring and Campus topologies (7 tests)
8. Group 8: Dijkstra step-by-step state tracing and tentative distance snapshots (20 tests)
9. Group 9: Bellman-Ford algorithm, convergence, and parity comparison (35 tests)
10. Group 10: JSON serialization, schema validation, and failover network import (19 tests)
11. Group 11: RouteLab 2.1 Custom Network Builder, router renaming, canvas selection state machine, and event log manager (41 tests)

---

## 5. Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm

### Installation & Run
```bash
# Clone the repository
git clone https://github.com/your-username/RouteLab.git
cd RouteLab

# Install dependencies
npm install

# Start Vite development server
npm run dev

# Run all 190 automated tests
npm test

# Build production bundle
npm run build
```
5. **Table Derivation**: `buildRoutingTable(graph, nodeIds, source)` performs a single full-graph relaxation from the source to compute optimal distances, predecessor trees, and next-hop entries for all destinations.
6. **State Synchronization**: React state acts as the single source of truth. Changes to node positions, link weights, or link states trigger instantaneous updates across canvas edges, path summaries, and table rows.

---

## 6. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       RouteLab (App)                        │
└──────┬───────────────────────┬───────────────────────┬──────┘
       │                       │                       │
       ▼                       ▼                       ▼
┌──────────────┐       ┌──────────────┐        ┌──────────────┐
│  Header.jsx  │       │ Sidebar.jsx  │        │ResultsPanel  │
│  - Branding  │       │ - Controls   │        │ - Path Info  │
│  - Reset     │       │ - Add Form   │        │ - Table View │
└──────────────┘       │ - Link Props │        │ - Banner Msg │
                       │ - Src / Dst  │        └──────────────┘
                       └──────┬───────┘
                              │
                              ▼
                       ┌──────────────┐
                       │NetworkCanvas │
                       │ - React Flow │
                       │ - RouterNode │
                       │ - Edge Style │
                       │ - Legend     │
                       └──────┬───────┘
                              │
               ┌──────────────┴──────────────┐
               ▼                             ▼
       ┌──────────────┐              ┌──────────────┐
       │   graph.js   │              │ dijkstra.js  │
       │ - buildGraph │              │ - Shortest   │
       │ - getNodeIds │              │ - Table Gen  │
       └──────────────┘              └──────────────┘
```

---

## 7. Dijkstra's Algorithm

Dijkstra's algorithm finds the shortest path from a starting node to all other nodes in a graph with non-negative edge weights.

### Pseudocode Implemented in RouteLab
```text
function Dijkstra(Graph, Source):
    for each vertex v in Graph:
        dist[v] ← Infinity
        prev[v] ← undefined
    dist[Source] ← 0

    Unvisited ← Set of all vertices in Graph

    while Unvisited is not empty:
        u ← vertex in Unvisited with smallest dist[u]
        if dist[u] = Infinity:
            break // remaining vertices are unreachable
        
        remove u from Unvisited

        for each neighbor v of u:
            if v is in Unvisited and link(u, v) is enabled:
                alt ← dist[u] + cost(u, v)
                if alt < dist[v]:
                    dist[v] ← alt
                    prev[v] ← u

    return dist, prev
```

### Time Complexity
RouteLab employs an $O(|V|^2 + |E|)$ scan implementation. For small laboratory topologies ($|V| \le 26$), this approach is clear, eliminates priority queue overhead, and is simple to trace during viva examinations.

---

## 8. Link Failure and Rerouting

In real-world networks, fiber cuts, hardware faults, or administrative shutdowns disable transmission paths. Routing protocols must detect these failures, update link-state databases, and converge on alternate paths.

In RouteLab:
1. When a user clicks **Disable Link** on edge $(u, v)$, the link's state is flagged as `enabled: false`.
2. The link remains visible on the canvas with a distinctive **dashed red stroke** (`#ef4444`).
3. `buildGraph()` excludes the disabled link from the adjacency list.
4. If a path was actively displayed, RouteLab automatically re-runs Dijkstra's algorithm.
5. If an alternative route exists, the path highlight and routing table update immediately with an informational message.
6. If no path exists, the interface reports *"No route available"*, and the destination row in the routing table displays `Cost: ∞`, `Next Hop: —`, `Path: Unreachable`.

---

## 9. Installation Instructions

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18.0.0 or higher recommended)
- `npm` (bundled with Node.js)

### Setup Steps
1. Clone or download the repository to your local computer:
   ```bash
   git clone https://github.com/your-username/RouteLab.git
   cd RouteLab
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the local development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to:
   ```
   http://localhost:5173/
   ```

### Running Unit Tests
To run the automated Dijkstra and routing-table test suite:
```bash
npm test
```

### Building for Production
To create an optimized production build:
```bash
npm run build
```
The output files will be created in the `dist/` directory.

---

## 10. How to Use

1. **Calculate a Shortest Path**:
   - In the left sidebar, choose a **Source Router** (e.g., `A`).
   - Choose a **Destination Router** (e.g., `E`).
   - Select the desired algorithm: **Dijkstra's (Link-State)** or **Bellman-Ford (Distance-Vector)**.
   - Click **Find Shortest Path**.
   - Observe the highlighted green route on the canvas, the total cost metric, and the highlighted row in the routing table.
2. **Inspect Algorithm Steps (Dijkstra)**:
   - When Dijkstra is selected, click the **Algorithm Steps** button in the Results panel.
   - Use **Next Step** and **Previous Step** to step through router settlements.
   - Observe tentative distances updating and the active router lighting up in purple on the canvas.
3. **Compare Routing Algorithms**:
   - Click **Compare Algorithms** to view side-by-side metrics, costs, time complexities, and protocol contexts.
4. **Simulate a Packet Transmission**:
   - Click **Send Packet** to watch the animated packet marker traverse the route hop by hop.
5. **Save & Load Custom Networks**:
   - Click **Export** in the top header to save the current network as a `.json` file.
   - Click **Import** to load a saved network topology file.
6. **Simulate a Link Failure**:
   - Click any link directly on the canvas (e.g., `B–D`).
   - In the sidebar's **Selected Link** panel, click **Disable Link**.
   - Watch the link change to a dashed red line and the route instantly recalculate to an alternate path.
7. **Restore a Link**:
   - Click the disabled link and click **Enable Link**.
   - Notice the original optimal route return.
4. **Edit the Network**:
   - Click **Add Router** to introduce new nodes (`F`, `G`, etc.).
   - Click **Add Link**, pick two endpoints and a cost, then click **Add Link**.
   - Click any edge to change its weight or delete it.
   - Click any node to remove it and its attached connections.
5. **Reset Network**:
   - Click **Reset Network** in the top header at any time to return to the original 5-router lab topology.

---

## 11. Example Network and Results

### Default Laboratory Topology
- Links:
  - $A - B = 4$
  - $A - C = 2$
  - $B - C = 1$
  - $B - D = 5$
  - $C - D = 8$
  - $C - E = 10$
  - $D - E = 2$

### Verified Scenarios

| Scenario | Path from $A$ to $E$ | Total Cost | Explanation |
| :--- | :--- | :---: | :--- |
| **Normal Network** | $A \to C \to B \to D \to E$ | **10** | Path via $C$ and $B$ is cheaper ($2+1+5+2 = 10$) than direct $A \to C \to E$ ($2+10 = 12$). |
| **Link $B-D$ Disabled** | $A \to C \to E$ | **12** | With $B-D$ offline, $A \to C \to E$ ($2+10=12$) is preferred over $A \to C \to D \to E$ ($2+8+2=12$ with tie-break). |
| **Link $B-D$ Restored** | $A \to C \to B \to D \to E$ | **10** | Returns to original optimal route. |
| **Links $C-E$ and $D-E$ Disabled** | *No route available* | **$\infty$** | Router $E$ is completely partitioned from the network. |

---

## 12. Screenshots

*(Screenshots can be placed in `docs/screenshots/` or viewed during live demonstration)*

- **Initial Topology & Shortest Path**: Shows 5 routers, 7 links, and the optimal path $A \to C \to B \to D \to E$ highlighted in green with cost 10.
- **Link Failure & Rerouting**: Shows link $B-D$ rendered with dashed red line, banner notice displayed, and the new route $A \to C \to E$ with cost 12.
- **Routing Table View**: Complete 5-row routing table for Source $A$ displaying Next Hop, Metric, and Path sequence.

---

## 13. Limitations

- **Centralized Simulation**: RouteLab runs Dijkstra centrally in browser JavaScript; it does not simulate distributed distance-vector or link-state packet exchanges over sockets.
- **Undirected Links**: All connections are bidirectional with symmetric costs in both directions.
- **Non-negative Weights Only**: Negative weights are disallowed, as Dijkstra's algorithm requires non-negative link costs.
- **Layer 3 Scope**: Does not simulate MAC addresses (Layer 2), IP subnetting / CIDR masks, or transport protocols (TCP/UDP).

---

## 14. Future Scope

1. **Step-by-Step Algorithm Playback**: Animate the node relaxation loop step by step with pause/play controls for classroom lectures.
2. **Bellman-Ford Algorithm Mode**: Allow switching between Dijkstra (Link-State) and Bellman-Ford (Distance Vector) to compare algorithm convergence.
3. **Directed Asymmetric Links**: Support separate forward and reverse costs for transmission links.
4. **Subnet & IP Configuration**: Allow assigning IP addresses and subnet masks to router interfaces.
5. **Topology Export/Import**: Save and load custom topologies via JSON files.

---

## License

This project is open-source and intended for academic and educational purposes under the MIT License.
