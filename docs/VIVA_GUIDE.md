# RouteLab — Comprehensive Computer Networks Viva Guide

This document is prepared specifically for students presenting **RouteLab** in university Computer Networks oral examinations (viva voce), lab assessments, and project defenses.

---

## SECTION A — PROJECT EXPLANATION

### 1. 30-Second Elevator Pitch
> *"Good morning/afternoon, Sir/Madam. Our project is **RouteLab**, an interactive network routing simulator. It allows students to visually build and modify network topologies consisting of routers and weighted links, run Dijkstra's shortest-path algorithm dynamically, inspect how routing tables are constructed at individual routers, and simulate physical link failures to observe immediate automatic rerouting. It is built using React and React Flow as an educational tool to bridge theoretical routing concepts with visual practice."*

### 2. 1-Minute Detailed Explanation
> *"In Computer Networks, routing protocols like OSPF use Dijkstra’s algorithm to calculate the most cost-effective path for forwarding data packets across an Autonomous System. While students study this algorithm on paper, it is difficult to visualize how network topology changes or link failures dynamically alter routing decisions.*
>
> *RouteLab solves this problem by providing a real-time, browser-based laboratory simulator. Users can add or reposition routers, configure link costs, and select source and destination routers. The system models the topology as a weighted undirected graph and calculates the optimal route using Dijkstra’s algorithm, highlighting the path and computing total cost. Furthermore, it generates the full routing table for the source router, displaying destinations, next hops, and minimum metrics.*
>
> *A key feature is link failure simulation: users can disable any link, immediately observing how the graph is updated, how the algorithm finds alternate paths (such as increasing cost from 10 to 12 when link B-D fails), and how the routing table converges. All logic runs client-side with zero external algorithmic dependencies."*

### 3. Problem Statement
Traditional computer networking education relies heavily on blackboard diagrams or complex industrial CLI tools (like Cisco Packet Tracer or GNS3). Complex CLI tools require extensive setup and obscure the underlying graph-theoretic algorithms. There is a need for a lightweight, visual, and focused educational tool that explicitly demonstrates the mathematical and algorithmic foundation of link-state routing without configuration overhead.

### 4. Objectives
1. Visually demonstrate graph-theoretic modeling of router topologies.
2. Interactively compute and display Dijkstra's shortest paths with step costs.
3. Automatically generate router-level routing tables with accurate next-hop resolution.
4. Demonstrate network convergence and rerouting under simulated link failure conditions.

### 5. Working Methodology
- **Graph Representation**: Network topology is stored in React state as arrays of node and edge objects.
- **Adjacency Translation**: An abstraction layer (`buildGraph`) translates the active state into a memory-efficient Adjacency List `Map<RouterId, Array<{neighbor, cost, edgeId}>>`, filtering out disabled links.
- **Shortest Path Computation**: `runDijkstra` takes the graph, source, and destination, finding the minimum path using relaxation.
- **Routing Table Construction**: `buildRoutingTable` runs a complete traversal from the chosen source, deducing the next-hop router (the first router along the shortest path after the source) for all reachable destinations.

---

## SECTION B — CORE NETWORKING CONCEPTS

### 1. Computer Network
An interconnected collection of autonomous computing devices (hosts, servers, routers, switches) capable of exchanging information over transmission media using standardized communication protocols.

### 2. Router
A Layer 3 (Network Layer) internetworking device that connects two or more independent networks, inspects incoming packet destination IP addresses, and forwards packets along optimal paths based on its internal routing table.

### 3. Network Topology
The structural arrangement of network components. Physical topology refers to cable layout and hardware placement; logical topology refers to how data signals flow across the network.

### 4. Network Layer (OSI Layer 3)
The layer responsible for host-to-host communication, logical addressing (IPv4/IPv6), packet forwarding, routing, and fragmentation.

### 5. Routing
The network-layer mechanism of determining the end-to-end path that a packet must traverse across an internetwork from source to destination.

### 6. Static vs. Dynamic Routing
- **Static Routing**: Network routes are manually configured by a system administrator. They do not automatically adjust to topology changes or link failures.
- **Dynamic Routing**: Routers run routing protocols (e.g., OSPF, RIP, BGP) to automatically exchange network state, calculate optimal paths, and adapt dynamically when links fail or metrics change.

### 7. Routing Algorithms
Mathematical procedures executed by routers to determine the shortest or least-cost path across a network graph. They are broadly classified into:
- **Link-State Algorithms** (e.g., Dijkstra's algorithm, used in OSPF)
- **Distance-Vector Algorithms** (e.g., Bellman-Ford algorithm, associated with RIP)
- *(Note: BGP uses a Path-Vector approach for inter-domain routing, advertising whole AS path sequences rather than simple distance vectors).*

### 8. Link-State Routing
A dynamic routing approach where every router discovers its neighbors, measures cost to each neighbor, constructs a Link-State Advertisement (LSA), and floods this information throughout the entire network. Every router thus constructs an identical, complete map of the network and independently runs Dijkstra's algorithm.

### 9. Dijkstra's Algorithm
A greedy graph-search algorithm developed by Edsger W. Dijkstra in 1956 that finds the shortest path between a source node and all other nodes in a weighted graph containing non-negative edge weights.

### 10. Weighted Graph
A mathematical graph $G = (V, E)$ where each edge $(u, v) \in E$ has an associated numerical value $w(u, v) \in \mathbb{R}^+$ representing a cost metric (delay, physical distance, inverse bandwidth, or administrative preference).

### 11. Routing Table
An internal data structure stored in a router's memory containing mapping rules that dictate where packets destined for a given network should be forwarded. Typical fields: **Destination Network / Host**, **Next Hop Router**, **Cost / Metric**, and **Network Interface**.

### 12. Next Hop
The IP address or identifier of the very next intermediate router along the shortest path to which a packet must be forwarded. A router does not need to know the entire end-to-end path to forward a packet; it only needs to know the **next hop**.

### 13. Link Cost (Metric)
A quantitative measure assigned to a transmission link. In protocols like OSPF, link cost is typically inversely proportional to link bandwidth:
$$\text{Cost} = \frac{\text{Reference Bandwidth}}{\text{Link Bandwidth}}$$
Lower cost denotes a faster, more desirable path.

### 14. Link Failure
A condition where a physical transmission line or router interface stops operating (due to hardware defect, cable severance, or administrative shutdown), preventing packet transmission across that edge.

### 15. Network Convergence
The state in which all routers in a network possess a consistent, synchronized, and up-to-date view of the network topology and optimal routes following a topology change.

### 16. OSPF (Open Shortest Path First)
An open-standard, widely used Interior Gateway Protocol (IGP) operating at the network layer within a single Autonomous System. OSPF is a link-state protocol that uses Dijkstra’s algorithm to compute shortest-path trees.

---

## SECTION C — DIJKSTRA'S ALGORITHM EXPLAINED

### 1. Conceptual Explanation
Dijkstra's algorithm is a **greedy algorithm**. It maintains two sets of vertices:
1. Vertices whose shortest distance from the source is already finalized ($S$).
2. Vertices whose shortest distance is not yet finalized ($Q$).

At each step, the algorithm chooses the unvisited vertex with the minimum tentative distance, adds it to the finalized set, and **relaxes** all of its outgoing edges.

### 2. The Step-by-Step Procedure
1. Set the distance to the source node to `0`, and the distance to all other nodes to `Infinity`.
2. Initialize an empty predecessor map and mark all nodes as unvisited.
3. While there are unvisited nodes:
   - Select the unvisited node $u$ with the minimum tentative distance.
   - If the minimum distance is $\infty$, the remaining nodes are unreachable; terminate.
   - Mark $u$ as visited (finalized).
   - If $u$ is the target destination (for single-pair shortest path), terminate early.
   - For each unvisited neighbor $v$ of $u$:
     - Calculate alternative distance: $\text{alt} = \text{dist}[u] + \text{weight}(u, v)$.
     - If $\text{alt} < \text{dist}[v]$, update $\text{dist}[v] = \text{alt}$ and set $\text{prev}[v] = u$.
4. Reconstruct the path by backtracking from destination to source using the predecessor map.

### 3. Step-by-Step Solved Example (RouteLab Default Topology)

**Topology**:
- Nodes: $A, B, C, D, E$
- Edges:
  - $(A, B) = 4$
  - $(A, C) = 2$
  - $(B, C) = 1$
  - $(B, D) = 5$
  - $(C, D) = 8$
  - $(C, E) = 10$
  - $(D, E) = 2$

**Goal**: Shortest path from $A$ to $E$.

| Step | Current Node $u$ | Visited Set | Tentative Distances [A, B, C, D, E] | Predecessor Map | Action / Edge Relaxation |
| :---: | :---: | :---: | :---: | :---: | :--- |
| **Init** | — | $\emptyset$ | $[0, \infty, \infty, \infty, \infty]$ | $\{A:\text{null}, B:\text{null}, C:\text{null}, D:\text{null}, E:\text{null}\}$ | Initial state, start at source $A$. |
| **1** | **A** (dist 0) | $\{A\}$ | $[0, 4, 2, \infty, \infty]$ | $\{B:A, C:A\}$ | Relax $(A,B) \implies 4$; Relax $(A,C) \implies 2$. |
| **2** | **C** (dist 2) | $\{A, C\}$ | $[0, 3, 2, 10, 12]$ | $\{B:C, D:C, E:C\}$ | Relax $(C,B) \implies 2+1=3 < 4$ (updated!); Relax $(C,D) \implies 2+8=10$; Relax $(C,E) \implies 2+10=12$. |
| **3** | **B** (dist 3) | $\{A, C, B\}$ | $[0, 3, 2, 8, 12]$ | $\{D:B\}$ | Relax $(B,D) \implies 3+5=8 < 10$ (updated!). |
| **4** | **D** (dist 8) | $\{A, C, B, D\}$ | $[0, 3, 2, 8, 10]$ | $\{E:D\}$ | Relax $(D,E) \implies 8+2=10 < 12$ (updated!). |
| **5** | **E** (dist 10) | $\{A, C, B, D, E\}$ | $[0, 3, 2, 8, 10]$ | $\{E:D\}$ | Destination reached. Finalized distance = **10**. |

**Path Reconstruction (Backtracking)**:
- $E \leftarrow D \leftarrow B \leftarrow C \leftarrow A$
- **Resulting Path**: $\mathbf{A \to C \to B \to D \to E}$, **Cost**: $\mathbf{10}$.

---

### 4. Time and Space Complexity
- **Time Complexity**:
  - In RouteLab: $O(|V|^2 + |E|)$ using linear array scanning.
  - In optimized implementations (min-heap / priority queue): $O((|V| + |E|) \log |V|)$.
  - *Viva explanation*: For small campus laboratory networks ($|V| \le 26$), the $O(|V|^2)$ approach avoids priority queue memory overhead, is simple, and runs in sub-millisecond time.
- **Space Complexity**: $O(|V| + |E|)$ to store the adjacency list, distance map, and predecessor map.

### 5. Why Does Dijkstra Fail with Negative Edge Weights?
Dijkstra's algorithm assumes that once a vertex is added to the finalized set ($S$), its distance is permanent and cannot be decreased further. A negative edge weight can decrease the cost of an already finalized path, invalidating the greedy choice property. (Bellman-Ford must be used when negative edge weights exist). In computer networking, transmission costs (delay, hop count, inverse bandwidth) are always strictly positive, making Dijkstra fully appropriate.

---

## SECTION D — 20 IMPORTANT VIVA QUESTIONS & ANSWERS

#### Q1. What is RouteLab?
**Ans:** RouteLab is an interactive web-based network routing simulator that visualizes network topologies, executes Dijkstra's algorithm to compute shortest paths, generates router-specific routing tables, and simulates link failures with real-time automatic rerouting.

#### Q2. Why did you choose Dijkstra's algorithm instead of Bellman-Ford?
**Ans:** Dijkstra is the algorithmic foundation of modern Interior Gateway Protocols like OSPF and IS-IS. In link-state routing, every router has a complete topology map and runs Dijkstra independently. Bellman-Ford is used in distance-vector protocols (like RIP) which suffer from slower convergence and the "count-to-infinity" problem.

#### Q3. How does RouteLab represent the network topology internally?
**Ans:** The topology is stored as React state and translated into an undirected adjacency list: a JavaScript `Map` where each router ID maps to an array of objects representing its neighbors, edge costs, and edge IDs.

#### Q4. What happens when a link fails in RouteLab?
**Ans:** When a link is disabled, its `enabled` property is set to `false`. The `buildGraph` utility excludes disabled links from the graph. If a path was actively displayed, RouteLab automatically recalculates the route with the new topology, updates canvas styling to dashed red, recalculates the routing table, and displays an informational status banner.

#### Q5. How does the routing table determine the "Next Hop"?
**Ans:** After running Dijkstra from the source router to all nodes, the shortest path to each destination is reconstructed by backtracking predecessors. The next hop is the second node in that path sequence (the immediate neighbor of the source). If the destination is the source itself or is unreachable, next hop is marked as `—`.

#### Q6. What happens if a destination router is disconnected or unreachable?
**Ans:** Its distance remains `Infinity`. The simulator displays *"No route available"*, removes edge highlighting, and in the routing table shows `Next Hop: —`, `Cost: ∞`, and `Path: Unreachable`.

#### Q7. Does RouteLab implement actual OSPF packet exchanges?
**Ans:** No. RouteLab is an educational, centralized graph simulation. It demonstrates the shortest-path mathematical algorithm and table generation of link-state routing, but does not simulate distributed Hello packets, LSA flooding, or socket-level IP forwarding.

#### Q8. Why are link costs important in networking?
**Ans:** Link costs allow network administrators to steer traffic over desirable links (e.g., high-speed fiber) and avoid slow, congested, or expensive links. OSPF calculates link cost as $\text{Reference Bandwidth} / \text{Interface Bandwidth}$.

#### Q9. How do you resolve ties when two paths have the identical minimum cost?
**Ans:** RouteLab employs deterministic alphabetical tie-breaking. Unvisited nodes are sorted alphabetically before selecting the candidate with the minimum distance, ensuring consistent and reproducible routing paths.

#### Q10. What is the difference between Routing and Forwarding?
**Ans:**
- **Routing**: The control plane process of determining the end-to-end paths across the entire network topology (building routing tables).
- **Forwarding**: The data plane process of moving an arriving packet from an input interface to the appropriate output interface on a single router based on the routing table.

#### Q11. What is the time complexity of your Dijkstra implementation?
**Ans:** $O(|V|^2 + |E|)$. It uses an array scan over unvisited nodes. In a university educational simulation with under 30 nodes, this executes in less than 1 millisecond and keeps the codebase straightforward without unnecessary third-party data structure libraries.

#### Q12. What frontend technologies did you use and why?
**Ans:** React 19 for component-driven UI and state synchronization, Vite for rapid development and bundling, `@xyflow/react` (React Flow) for interactive graph visualization and dragging, and plain CSS for a lightweight, university lab design.

#### Q13. Can RouteLab handle asymmetric link costs (different cost in each direction)?
**Ans:** Currently, RouteLab models undirected graphs where the cost between A and B is symmetric ($w(A, B) = w(B, A)$), which is standard for basic educational laboratory networks. Directed asymmetric links represent a valuable future enhancement.

#### Q14. What happens if source equals destination?
**Ans:** Dijkstra immediately returns a trivial path of length 1 containing just the source node, with cost `0` and empty edge list. In the routing table, the source row displays `Next Hop: —`, `Cost: 0`, and `Path: <Source>`.

#### Q15. How do you prevent invalid input when adding or editing links?
**Ans:** The interface validates that:
1. Both source and destination routers are selected.
2. The two endpoints are different (no self-loops).
3. The link cost is a finite number strictly greater than 0 ($w > 0$).
4. Duplicate links between the same two endpoints are rejected.

#### Q16. What is network convergence time?
**Ans:** The time elapsed between a network topology change (such as link failure or addition) and the moment all routers have updated their routing tables to reflect the new optimal paths. In RouteLab, convergence is virtually instantaneous because calculations run client-side.

#### Q17. What is an Autonomous System (AS)?
**Ans:** A collection of routers and IP networks under the administrative control of a single entity (such as an ISP, university, or enterprise) that adheres to a common internal routing policy using an Interior Gateway Protocol like OSPF.

#### Q18. How does RouteLab handle router deletion?
**Ans:** When a router is removed, RouteLab automatically filters out the router node and all incident edges connected to it, preventing dangling references. If the removed router was selected as source or destination, those selections are cleared, and the path is invalidated.

#### Q19. Why does RouteLab use a dashed red line for disabled links instead of deleting them?
**Ans:** In real networks, a failed link is not physically dismantled—it remains part of the physical infrastructure but is administratively or operationally down. Keeping it visible allows users to inspect the broken connection and easily restore it to test network recovery.

#### Q20. What are the key limitations of your mini-project?
**Ans:** RouteLab runs centralized in the browser rather than distributed across multiple independent machines. It does not model packet queues, buffer overflows, transport layer TCP/UDP headers, or Layer 2 MAC frame encapsulation.

#### Q21. How does the Packet Journey Simulation work in RouteLab 2.0?
**Ans:** After Dijkstra's algorithm determines the shortest path sequence, clicking "Send Packet" triggers a smooth `requestAnimationFrame` animation loop. A small visual packet marker glides sequentially along each hop from router to router. The active hop edge is highlighted, a hop counter tracks progress (e.g., "Hop 2 of 4"), and upon arrival at the destination node, a delivery confirmation is recorded. If the network topology changes during transit (such as a link failure), the simulation safely halts.

#### Q22. What predefined network scenarios are supported in RouteLab 2.0?
**Ans:** RouteLab 2.0 includes three realistic scenarios:
1. **Basic Network (5 Routers)**: The standard laboratory topology with alternate routes.
2. **Ring Network (6 Routers)**: Demonstrates clockwise vs. counter-clockwise path choice and automatic rerouting around a ring when an edge fails.
3. **Campus Network**: Real-world university topology connecting Admin, Academic Block, CS Lab, Library, and Student Hostel routers.

#### Q23. How does the Dijkstra Step-by-Step Visualization work in RouteLab 2.0?
**Ans:** During the execution of Dijkstra's algorithm, RouteLab records a deterministic execution trace containing independent immutable snapshots of each algorithm step. Step 0 initializes source distance to 0 and all others to $\infty$. Each subsequent step selects the unvisited router with the smallest tentative distance, relaxes its incident edges, and snapshots: (a) currently settled router, (b) visited router set, (c) tentative distance vector, (d) predecessor pointers, and (e) plain-English narrative of edge relaxation. In the UI, stepping through the explorer dynamically highlights the active router with a purple ring on the canvas.

#### Q24. How does Dijkstra's algorithm compare to the Bellman-Ford algorithm?
**Ans:**
- **Algorithmic Paradigm**: Dijkstra is a **greedy algorithm** that settles the global shortest path to one vertex per iteration. Bellman-Ford is based on **dynamic programming**, iteratively relaxing all edges across $|V|-1$ passes.
- **Routing Protocol Family**: Dijkstra is used in **Link-State protocols** such as OSPF. Bellman-Ford is associated with **Distance-Vector approaches** such as RIP. (Note: BGP is a path-vector protocol, not ordinary distance-vector routing).
- **Scope & Modeling**: RouteLab simulates centralized graph-based routing algorithms on an active topology, rather than actual distributed OSPF LSA flooding or RIP periodic message exchanges over physical network interfaces.
- **Path Parity**: On undirected graphs with positive edge weights, both algorithms produce identical minimum total path costs.

#### Q25. What is the time complexity difference between Dijkstra and Bellman-Ford?
**Ans:**
- **Dijkstra**: $O(|V|^2 + |E|)$ with an array scan, or $O((|V| + |E|) \log |V|)$ with a min-heap priority queue.
- **Bellman-Ford**: $O(|V| \cdot |E|)$, because it relaxes all $|E|$ edges for up to $|V|-1$ iterations. RouteLab implements an early-termination optimization that halts as soon as a complete pass produces no further distance improvements.

#### Q26. How does RouteLab handle Network Save and Load (JSON Export/Import)?
**Ans:** RouteLab implements pure client-side JSON serialization. Clicking **Export** creates a structured JSON payload adhering to `schemaVersion: 1`, containing router IDs, coordinates, and link configurations, and triggers a browser file download using `Blob` and `URL.createObjectURL`. Clicking **Import** reads a user-selected `.json` file using the HTML5 `FileReader` API.

#### Q27. How does RouteLab validate imported JSON topologies to prevent errors and crashes?
**Ans:** The validation engine (`validateAndImportNetwork` in `serialization.js`) rigorously enforces safety:
1. Rejects malformed JSON syntax and files exceeding 500 KB.
2. Verifies schema version compatibility (`schemaVersion: 1`).
3. Enforces router limits ($\le 50$) and link limits ($\le 100$).
4. Rejects duplicate router IDs and duplicate undirected links between the same router pair.
5. Prohibits self-loops (links where `source === target`).
6. Verifies that all link endpoints reference existing routers.
7. Ensures all link costs are strictly positive numbers ($w > 0$).
If any check fails, a user-friendly error message is displayed and the current active topology remains untouched.

#### Q28. How does RouteLab 2.1 support custom network design from a blank canvas?
**Ans:** RouteLab 2.1 allows users to initiate a "New Custom Network" from the header actions or preset selector. It prompts for a network name, warns if unsaved topology changes exist, clears previous nodes, edges, route results, and packet states, and displays a clean empty state card on the canvas ("Your network is empty. Add a router from the left sidebar to get started."). Users can then add 2–20+ routers, drag them to desired coordinates, and connect them with positive weighted links.

#### Q29. How does the Router Renaming feature work while preserving internal stability?
**Ans:** In RouteLab 2.1, each router node possesses a stable, immutable internal identifier (e.g., `id: 'R1'`) and an optional human-readable display label (e.g., `data.label: 'Gateway'`). When renaming a router, RouteLab validates that the new name is non-empty and does not collide with existing router IDs or labels. By preserving the internal `id` for graph adjacency lists, edge endpoints (`source`/`target`), and algorithm execution, display labels can be updated dynamically without breaking graph continuity or rerouting links.

#### Q30. What is Interactive Packet Mode ("Select on Canvas")?
**Ans:** "Select on Canvas" is a streamlined interactive mode designed to eliminate tedious dropdown selections. When enabled:
1. The first router clicked on the canvas is designated as the **Source**.
2. The second router clicked on the canvas is designated as the **Destination**.
3. RouteLab automatically exits selection mode and immediately computes the optimal shortest path using the active routing algorithm (Dijkstra or Bellman-Ford).
4. The user can then click **Send Packet** to watch the packet marker animate across the newly calculated path.

#### Q31. What is the Simulation Event Log, and how does it differ from a real network packet capture?
**Ans:** The Simulation Event Log is an in-memory chronological record of high-level simulator milestones (network creation, router addition/renaming/removal, link metrics updates, link failures/restorations, shortest path calculations, and packet dispatch/delivery/cancellation).
- **Difference from Real Packet Captures (Wireshark / PCAP)**: In production networking, packet capture logs record raw binary frames and headers (Ethernet headers, IPv4/IPv6 headers with TTL and checksums, TCP/UDP port segments). RouteLab's event log records educational simulation events generated by the React application state machine, keeping the latest 50 events purely in browser memory with zero backend dependencies.

#### Q32. How are custom networks persisted and shared?
**Ans:** Custom networks are serialized into structured JSON conforming to `schemaVersion: 1`. The export includes:
- Network name (e.g., `"Enterprise WAN"`).
- Router array with stable `id`, human-readable `label`, and pixel coordinates `{ x, y }`.
- Link array with `source`, `target`, metric `cost`, and boolean `enabled` state.
When re-imported, the schema validator restores the custom topology exactly as designed, including disabled link states and custom display labels.

#### Q33. What is the current automated test coverage of RouteLab 2.1?
**Ans:** RouteLab 2.1 is backed by **190 automated tests** passing with 0 failures across 11 test groups. The tests verify standard topologies, boundary edge cases, alternative path resolutions, routing tables, dynamic link failures and automatic rerouting, presets (Ring and Campus), step-by-step state tracing, Bellman-Ford parity, JSON serialization/import validation, custom topology design, router renaming, canvas selection state transitions, and event log management.
