# RouteLab 2.1: Custom Network Design & Interactive Simulation for Computer Networks Education

**A Mini-Project Report**  
*Submitted in partial fulfillment of the requirements for the degree of*  
**Bachelor of Technology in Computer Science & Engineering / Information Technology**

---

## 1. Title of the Project
**RouteLab 2.1 — Custom Network Design & Interactive Simulation**

---

## 2. Abstract
Routing protocols are the cornerstone of modern internet communication, enabling autonomous routers to dynamically select optimal paths for data forwarding. However, classical computer networking curricula frequently treat shortest-path routing purely through theoretical chalkboard exercises, leaving students with an incomplete visual and operational understanding of algorithm execution, next-hop deduction, and fault recovery. 

This project presents **RouteLab 2.1**, an interactive, browser-based network routing simulator engineered with React, React Flow, and vanilla JavaScript. RouteLab enables students to construct custom network topologies from a blank canvas, rename routers with meaningful display labels, select endpoints directly on the canvas, execute Dijkstra’s and Bellman-Ford algorithms, examine dynamically generated router-level routing tables, inspect step-by-step relaxation snapshots, review chronological simulation event logs, and simulate real-time physical link failures with instant automatic rerouting. Operating entirely client-side without external algorithmic dependencies or backend complexity, RouteLab serves as an effective, accessible laboratory tool for computer networks education.

---

## 3. Introduction
The global Internet consists of thousands of interconnected Autonomous Systems (AS). Within each autonomous system, Interior Gateway Protocols (IGPs) such as Open Shortest Path First (OSPF) and Intermediate System to Intermediate System (IS-IS) are tasked with computing loop-free, minimum-cost paths across a complex web of routers and physical links.

At the theoretical core of these protocols lies graph theory. A computer network is modeled as a weighted graph $G = (V, E)$, where vertices represent routers, edges represent physical connections, and edge weights represent metric values such as transmission delay, hop count, or inverse bandwidth. 

To determine the lowest-cost paths, link-state routing protocols execute Dijkstra’s single-source shortest-path algorithm. While the algorithm is standard in computer science textbooks, students often struggle to understand how abstract node distances translate into concrete routing table structures (specifically the **Next Hop** concept) and how networks converge when physical links fail. RouteLab was created to bridge this pedagogical gap through interactive visual simulation.

---

## 4. Problem Statement
In conventional university network laboratory environments:
1. **Abstract Mathematical Instruction**: Students learn Dijkstra's algorithm manually using pencil and paper on small graphs, which fails to convey dynamic network behavior during topology changes.
2. **High Tool Complexity**: Commercial network emulation platforms (e.g., Cisco Packet Tracer, GNS3, Mininet) involve steep learning curves, proprietary CLI syntax, and extensive virtualization overhead that divert student attention away from fundamental graph algorithms.
3. **Lack of Instant Visual Feedback**: Existing web tools are often static, proprietary, or overly complex, lacking direct manipulation features like link failure simulation and live routing table derivation.

Hence, there is an evident need for a lightweight, interactive, zero-installation web simulator that directly demonstrates graph modeling, shortest-path calculation, routing table synthesis, and fault tolerance.

---

## 5. Objectives
The primary objectives of the RouteLab mini-project are:
1. **Interactive Topology Construction**: Enable users to visually add, drag, reposition, and remove router nodes on an interactive canvas.
2. **Dynamic Link Configuration**: Allow connecting router pairs with custom positive link weights, with full validation against duplicate or self-referential links.
3. **Dijkstra Algorithm Execution**: Implement a transparent, pure JavaScript execution of Dijkstra's algorithm to compute minimum-cost paths from any selected source to destination.
4. **Visual Route Highlighting**: Clearly differentiate source, destination, intermediate path nodes, and traversed transmission links using high-contrast color coding.
5. **Dynamic Routing Table Generation**: Automatically synthesize and display the complete routing table for the selected source router, indicating destination, next-hop gateway, total metric, and full path.
6. **Fault Tolerance Simulation**: Provide the ability to disable and restore arbitrary links, demonstrating immediate automatic route recalculation and network convergence.

---

## 6. Literature and Conceptual Background

### 6.1 Link-State Routing Concept
In Link-State routing:
- Each router establishes neighbor relationships across active interfaces.
- Each router measures the cost (metric) to its directly connected neighbors.
- Routers construct Link-State Advertisements (LSAs) and flood them across the network.
- Every router compiles an identical Link-State Database (LSDB), representing the complete network graph.
- Each router independently runs Dijkstra's algorithm using itself as the root to construct its shortest-path tree and populate its forwarding table.

### 6.2 Dijkstra's Shortest Path Algorithm
Discovered by Edsger W. Dijkstra in 1956, this greedy algorithm solves the single-source shortest-path problem for a graph with non-negative edge costs. By iteratively selecting the vertex with the minimal tentative distance from the unvisited set and relaxing its incident edges, the algorithm guarantees the optimal path in $O(|V|^2 + |E|)$ time using an array, or $O((|V| + |E|) \log |V|)$ using a binary min-heap.

### 6.3 Next-Hop Forwarding Principle
Hop-by-hop forwarding is fundamental to packet switching: an intermediate router does not specify the entire remaining route in the packet header. Instead, it looks up the packet's destination in its routing table and forwards the packet exclusively to the immediate adjacent neighbor along the shortest path—known as the **Next Hop**.

---

## 7. Technology Stack

RouteLab prioritizes simplicity, maintainability, and standard web engineering principles:

- **React 19 (JavaScript)**: Chosen for declarative UI management and instantaneous component re-rendering upon state changes. No TypeScript was used to keep the codebase accessible to undergraduate students.
- **Vite 6**: Used as the frontend build tool and local development server, providing fast Hot Module Replacement (HMR).
- **@xyflow/react (React Flow 12)**: Provides the interactive node-and-edge canvas, custom SVG edge rendering, node dragging, viewport panning, and zoom controls.
- **Lucide React**: Provides lightweight, clean icons for interface buttons.
- **Plain CSS**: Clean styling adhering to educational laboratory aesthetics (Inter typography, rectangular borders, subtle contrast, zero glassmorphism or neon styling).

---

## 8. Proposed System

RouteLab is designed as a single-page, multi-panel interactive application:
1. **Top Application Header**: Displays project branding and a prominent "Reset Network" button.
2. **Left Control Sidebar (~260px)**:
   - **Network Controls**: Buttons to add routers or trigger the inline link-creation form.
   - **Selected Router / Link Properties Panel**: Contextually appears when an item is clicked, allowing cost edits, link failure toggling, or deletion.
   - **Shortest Path Panel**: Source and destination dropdown selectors, "Find Shortest Path" button, and "Reset Path" button.
   - **Informational Section**: Concise explanation of link metrics.
3. **Main Central Workspace**: A large React Flow canvas containing draggable circular router nodes, weighted undirected edges, and a bottom-left connection-state legend.
4. **Bottom Results Panel**:
   - Left sub-panel: Shortest-path string sequence, total metric, algorithm indicator, and dynamic reroute notice banners.
   - Right sub-panel: Live, tabular routing table for the active source router.

---

## 9. System Architecture

The following diagram illustrates the component hierarchy and data flow:

```
                      +-------------------+
                      |      App.jsx      |
                      | (State Authority) |
                      +---------+---------+
                                |
        +-----------------------+-----------------------+
        |                       |                       |
        v                       v                       v
+---------------+       +---------------+       +---------------+
|  Header.jsx   |       |  Sidebar.jsx  |       |ResultsPanel   |
| (Reset Action)|       | (User Inputs) |       | (Path & Table)|
+---------------+       +-------+-------+       +---------------+
                                |
                                v
                      +-------------------+
                      | NetworkCanvas.jsx |
                      |  (React Flow UI)  |
                      +---------+---------+
                                |
               +----------------+----------------+
               |                                 |
               v                                 v
     +-------------------+             +-------------------+
     |     graph.js      |             |    dijkstra.js    |
     | (Adjacency List)  |             |  (Core Algorithm) |
     +-------------------+             +-------------------+
```

---

## 10. Algorithm and Methodology

### 10.1 Graph Construction (`buildGraph`)
The system extracts nodes and edges from React state. An edge is included in the graph if and only if `edge.data.enabled !== false` and `!edge.data.failed`. The graph is structured as:
$$\text{Map}\langle \text{NodeId}, \text{Array}\langle\{\text{neighbor}: \text{NodeId}, \text{cost}: \text{Number}, \text{edgeId}: \text{String}\}\rangle\rangle$$

### 10.2 Dijkstra Implementation (`runDijkstra`)
```text
Input: Graph G, Source s, Destination d
Output: Shortest Path, Minimum Cost, Edge IDs

1. Initialize dist[v] = Infinity, prev[v] = null, predEdge[v] = null for all v in G
2. Set dist[s] = 0, Visited = empty set
3. While there are unvisited vertices:
     a. u = unvisited vertex with minimum dist[u] (alphabetical tie-break)
     b. If dist[u] == Infinity or u == null: break
     c. Add u to Visited
     d. If u == d: break (early termination for single destination)
     e. For each neighbor v of u:
          If v not in Visited:
             newDist = dist[u] + cost(u, v)
             If newDist < dist[v]:
                 dist[v] = newDist
                 prev[v] = u
                 predEdge[v] = edgeId
4. If dist[d] == Infinity: return empty path
5. Backtrack from d using prev[] to reconstruct ordered path sequence
```

### 10.3 Routing Table Derivation (`buildRoutingTable`)
To construct the routing table for source $s$:
1. Run a full Dijkstra relaxation across all vertices without early exit.
2. For each destination $d \in V$:
   - If $d == s$: Next Hop = `—`, Cost = `0`, Path = `[s]`.
   - If $\text{dist}[d] == \infty$: Next Hop = `—`, Cost = `∞`, Path = `[]`.
   - Otherwise, trace predecessor chain from $d$ back to $s$. The **Next Hop** is assigned as $\text{path}[1]$ (the immediate first hop departing $s$).

---

## 11. Implementation Details

- **Deterministic Tie-Breaking**: When multiple unvisited nodes have equal tentative distances, nodes are sorted alphabetically. This ensures identical, reproducible results across test runs and classroom demonstrations.
- **Non-Destructive Link Disabling**: Toggling a link off sets `edge.data.enabled = false`. The edge remains in the DOM with a dashed red stroke (`#ef4444`) so the user can easily observe and restore it.
- **Reactive Rerouting**: If a user disables or enables a link while a shortest path is currently displayed, `App.jsx` automatically recomputes the route and updates the path highlights and routing table in the same render cycle.
- **Pure Client Execution**: All state operations are synchronous and run in the browser's JavaScript engine, requiring no network round-trips.

---

## 12. Results and Experimental Observations

The default RouteLab laboratory topology was used for experimental verification:

- **Vertices**: $A, B, C, D, E$
- **Links and Costs**:
  - $A - B = 4$
  - $A - C = 2$
  - $B - C = 1$
  - $B - D = 5$
  - $C - D = 8$
  - $C - E = 10$
  - $D - E = 2$

### Test Case 1: Baseline Shortest Path from A to E
- **Calculated Path**: $A \to C \to B \to D \to E$
- **Total Metric**: $2 + 1 + 5 + 2 = \mathbf{10}$
- **Observation**: Despite the direct link $(C, E)$ existing with cost 10, traversing the intermediate routers $B$ and $D$ yields an overall lower total metric ($2 + 1 + 5 + 2 = 10 < 2 + 10 = 12$). Dijkstra correctly selects the multi-hop path.

### Test Case 2: Routing Table for Source A
| Destination | Next Hop | Minimum Cost | Path Sequence |
| :---: | :---: | :---: | :--- |
| **A** | — | 0 | A |
| **B** | C | 3 | A → C → B |
| **C** | C | 2 | A → C |
| **D** | C | 8 | A → C → B → D |
| **E** | C | 10 | A → C → B → D → E |

*Observation*: All optimal routes from $A$ to $B, C, D,$ and $E$ begin by forwarding to **Router C**. Hence, the Next Hop for all remote routers is correctly deduced as $C$.

### Test Case 3: Link Failure Simulation (B–D Disabled)
- **Action**: Link $(B, D)$ disabled.
- **Automatic Reroute**: $A \to C \to E$
- **New Path Cost**: $2 + 10 = \mathbf{12}$
- **Routing Table Changes**:
  - Destination $D$: Next Hop $C$, Cost $10$, Path $A \to C \to D$ (via link $(C, D)$ with cost 8).
  - Destination $E$: Next Hop $C$, Cost $12$, Path $A \to C \to E$.
- **Status Notice**: Displayed *"Link B–D disabled. New route: A → C → E (cost 12)"*.

### Test Case 4: Link Restoration
- **Action**: Link $(B, D)$ re-enabled.
- **Convergence**: Immediately reverts to $A \to C \to B \to D \to E$ at cost **10**.

### Test Case 5: Destination Partitioning (C–E and D–E Disabled)
- **Action**: Both links incident to Router $E$ disabled.
- **Result**: Displayed *"No route available"*. Routing table for $E$ displays `Next Hop: —`, `Cost: ∞`, `Path: Unreachable`.

### Test Case 6: Dijkstra Step-by-Step Tracing (Phase 7)
- **Action**: Query route from $A$ to $D$, open Algorithm Steps explorer, and advance through steps.
- **Step 0**: Initialized $A = 0$, all other routers to $\infty$, $predecessors = \emptyset$.
- **Step 1**: Settled Router $A$ (distance 0), relaxed $(A, C) \to 2$ and $(A, B) \to 4$. Router $A$ highlighted with purple ring on canvas.
- **Step 2**: Settled Router $C$ (distance 2), relaxed $(C, B)$ updating tentative distance of $B$ to $2 + 1 = 3$.
- **Step 3**: Settled Router $B$ (distance 3), relaxed $(B, D)$ setting distance of $D$ to $3 + 5 = 8$.
- **Result**: Exactly traced greedy settlement sequence with deterministic immutable snapshots.

### Test Case 7: Bellman-Ford Routing & Algorithmic Comparison (Phase 7)
- **Action**: Switch Routing Algorithm to Bellman-Ford (Distance-Vector) and compare side by side.
- **Path Parity**: Produced exact cost match ($cost = 8$) for route $A \to C \to B \to D$.
- **Comparison Table**: Displayed theoretical time complexity ($O(|V|^2+|E|)$ vs $O(|V| \cdot |E|)$), protocol context (Link-State / OSPF vs Distance-Vector / RIP; note: BGP is a path-vector protocol), and design principles.
- **Simulation Scope**: Clarified that RouteLab simulates centralized graph-based routing, not real distributed OSPF LSA flooding or RIP packet exchanges.

### Test Case 8: Topology Save & Load with Schema Validation (Phase 7)
- **Action**: Export network to `routelab-basic-network.json`. Modify topology and re-import.
- **Result**: Restored complete topology accurately. Tested invalid JSON inputs (duplicate routers, negative costs, unknown endpoints), confirming all were caught by the validation engine with informative alerts.

### Test Case 9: Custom Topology Creation & Empty State (RouteLab 2.1)
- **Action**: Click "New Network" from the header actions, input network name "Enterprise WAN", and confirm.
- **Result**: Cleared all previous nodes, edges, active routes, and packet animations. Rendered the centered empty state indicator ("Your network is empty. Add a router from the left sidebar to get started."). Added 3 routers (A, B, C) and connected them with weighted links (costs 4, 3, 10).

### Test Case 10: Router Display Label Renaming with Duplicate Guard (RouteLab 2.1)
- **Action**: Select router A and enter display label "Gateway". Attempt to rename router B to "Gateway".
- **Result**: System successfully updated router A's display label to "Gateway" while preserving stable internal ID `A`. Rejected router B's duplicate rename attempt with an inline error message ("A router with name 'Gateway' already exists."). Successfully renamed router B to "Core-Switch".

### Test Case 11: Interactive Packet Mode ("Select on Canvas") (RouteLab 2.1)
- **Action**: Activate "Select on Canvas" mode. Click router A (Gateway) then router C on the canvas.
- **Result**: Canvas selection banner guided user through Step 1 (Source) and Step 2 (Destination). Upon selecting router C, selection mode automatically exited and immediately executed the shortest path calculation ($Gateway \to Core\text{-}Switch \to C$, cost 7). Clicking "Send Packet" animated the packet across the calculated path to delivery.

### Test Case 12: Simulation Event Log Tracking & Clearing (RouteLab 2.1)
- **Action**: Expand "Event Log" panel in Results subnav after performing network modifications.
- **Result**: Displayed chronological list of timestamped simulator events (Network created, router added, router renamed, link added, canvas selection, packet transmission, and link failure). Clicked "Clear Log" to verify complete history reset to empty state.

---

## 13. Automated Testing Verification (190 Tests)
RouteLab 2.1 is validated by an automated test suite containing **190 unit and integration tests** passing with 0 failures:
- Standard topology shortest paths: 9 tests
- Edge cases and unreachable destinations: 11 tests
- Equal-cost alternative routes: 4 tests
- Dynamic routing tables: 18 tests
- Topology modifications: 6 tests
- Link failure and automatic rerouting: 20 tests
- Preset networks (Ring & Campus): 7 tests
- Dijkstra step-by-step state tracing: 20 tests
- Bellman-Ford algorithm and path parity: 35 tests
- JSON serialization and import validation: 19 tests
- Custom network design, router renaming, canvas selection, and event logging: 41 tests

---

## 13. Advantages of RouteLab
1. **Zero Configuration**: Runs directly in standard modern web browsers with zero installation, backend services, or dependencies.
2. **Immediate Pedagogical Clarity**: Visual feedback directly connects graph edges to routing table rows, next hops, and algorithm execution steps.
3. **Multi-Algorithm Education**: Bridges the gap between Link-State (Dijkstra) and Distance-Vector (Bellman-Ford) routing paradigms.
4. **Robust Fault Emulation**: Dynamic link disabling models realistic network convergence scenarios without permanently destroying topology data.
5. **Portable Network Topologies**: Client-side JSON export/import enables easy assignment distribution and lab exam assessment.
6. **Lightweight & Fast**: Production build size is under 470 KB, loading in milliseconds.

---

## 14. Limitations
1. **Centralized Simulation**: Calculations are performed by a single centralized JavaScript engine rather than distributed autonomous routing agents exchanging socket packets.
2. **Symmetric Metrics**: Connections are modeled as undirected edges with identical costs in both directions ($w(u, v) = w(v, u)$).
3. **No Packet-Level Forwarding**: RouteLab focuses on control-plane path determination and does not simulate packet queuing, TTL decrementing, or buffer drops.
4. **Non-Negative Metric Constraint**: Adhering to standard routing metric principles, only positive link costs ($w > 0$) are permitted.

---

## 15. Future Scope
1. **Asymmetric Directed Links**: Support directed edges with independent forward and reverse transmission costs.
2. **IP Subnet Assignment & Longest Prefix Match**: Allow users to assign CIDR IP prefixes to interfaces to demonstrate routing table prefix lookup.
3. **Counting to Infinity & Poison Reverse Demonstration**: An interactive split-horizon simulation mode for distance-vector routing loops.

---

## 16. Conclusion
RouteLab successfully achieves all stated objectives of a Computer Networks undergraduate mini-project. By combining modern web frontend technologies with sound computer networking principles, it provides an intuitive, interactive environment for exploring network topologies, Dijkstra's shortest-path algorithm, next-hop routing tables, and fault-tolerant rerouting. The project reinforces core networking concepts in an engaging and accessible manner.

---

## 17. References
1. Kurose, J. F., & Ross, K. W. (2021). *Computer Networking: A Top-Down Approach* (8th ed.). Pearson.
2. Tanenbaum, A. S., Wetherall, D. J., & Feamster, N. (2021). *Computer Networks* (6th ed.). Pearson.
3. Dijkstra, E. W. (1959). *A note on two problems in connexion with graphs*. Numerische Mathematik, 1(1), 269–271.
4. Moy, J. (1998). *OSPF Version 2*. RFC 2328, Internet Engineering Task Force (IETF).
5. Cormen, T. H., Leiserson, C. E., Rivest, R. L., & Stein, C. (2009). *Introduction to Algorithms* (3rd ed.). MIT Press.
