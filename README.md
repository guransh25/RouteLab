<img width="1916" height="579" alt="image" src="https://github.com/user-attachments/assets/d188c2c6-6665-46e3-95f6-6c8de9daf8d2" /># RouteLab 2.1

### Interactive Network Routing Simulator

**Design networks. Explore routing algorithms. Simulate packet journeys.**

RouteLab is an interactive, browser-based Computer Networks simulator that helps users understand how routing algorithms determine optimal paths across interconnected routers.

Built with **React, JavaScript, and React Flow**, RouteLab provides a visual environment to create network topologies, compare routing algorithms, simulate packet transmission, and observe how routes change when network links fail.

The project focuses on making fundamental Computer Networks concepts easier to understand through hands-on experimentation.

**[Live Demo](https://routelab-2-1.vercel.app/) · [GitHub Repository](https://github.com/guransh25/RouteLab/)**

---

## Overview

In computer networks, routers determine how data should travel between different networks. The selection of efficient routes is an important part of network-layer communication.

RouteLab provides an interactive environment where users can:

- Build custom networks consisting of routers and weighted connections.
- Calculate shortest paths using Dijkstra's and Bellman-Ford algorithms.
- Visualize routing decisions and forwarding paths.
- Simulate packet journeys across multiple routers.
- Introduce link failures and observe automatic route recalculation.
- Compare routing algorithms and examine their execution.
- Save and restore custom network topologies.

RouteLab is designed for students, educators, and anyone interested in exploring routing fundamentals.

## Key Features

### 1. Interactive Network Topology Builder

Create and modify networks through an intuitive graphical interface.

- Add, rename, move, and delete routers.
- Create weighted bidirectional connections between routers.
- Modify link costs.
- Enable, disable, or remove links.
- Select source and destination routers directly from the canvas.
- Start from an empty network and design custom topologies.

Router positions can be adjusted using drag-and-drop interactions.

### 2. Shortest-Path Routing Algorithms

RouteLab supports two shortest-path algorithms:

**Dijkstra's Algorithm**

- Uses a greedy approach.
- Computes minimum-cost paths with nonnegative link weights.
- Maintains tentative distances and predecessor information.
- Demonstrates shortest-path computation used in link-state routing.

**Bellman-Ford Algorithm**

- Uses repeated edge relaxation.
- Computes shortest paths from a source router.
- Demonstrates an algorithmic foundation associated with distance-vector routing.
- Allows comparison with Dijkstra on the same network.

Both algorithms operate on the currently active topology.

### 3. Step-by-Step Dijkstra Visualization

Explore how Dijkstra's algorithm calculates the shortest path.

The Algorithm Steps panel displays:

- Currently processed router.
- Visited and unvisited routers.
- Tentative shortest distances.
- Predecessor information.
- Distance updates.
- Step-by-step explanations.

Users can navigate through the calculation using Previous, Next, and Reset controls.

### 4. Animated Packet Journey

Visualize a simulated packet traveling from a source router to a destination.

Features include:

- Hop-by-hop packet movement.
- Highlighting of the active connection.
- Packet progress indicator.
- Hop counter.
- Successful delivery status.
- Automatic cancellation when the network changes during transmission.

The packet animation represents a conceptual forwarding process; it does not transmit actual network packets.

### 5. Link Failure & Automatic Rerouting

Simulate network failures by disabling connections.

When a link fails, RouteLab:

1. Excludes the failed connection from routing calculations.
2. Updates the active network graph.
3. Recalculates available shortest paths.
4. Updates routing tables and path highlighting.
5. Displays an alternative route when one exists.

Links can be restored to observe how optimal routes change again.

### 6. Routing Tables

Generate routing tables for the selected source router.

Each entry contains:

| Field | Description |
|---|---|
| Destination | Target router |
| Next Hop | Immediate router along the selected path |
| Cost | Minimum cumulative routing cost |
| Path | Complete calculated route |

Disconnected destinations are identified as unreachable.

### 7. Predefined Network Scenarios

RouteLab includes three ready-to-use topologies:

| Scenario | Description |
|---|---|
| Basic Network | Five-router weighted topology for shortest-path demonstrations |
| Ring Network | Six-router ring demonstrating alternative routes |
| Campus Network | A simplified network connecting academic departments and campus facilities |

Users can switch between scenarios or create networks from scratch.

### 8. Custom Network Import & Export

Save network designs as JSON files and restore them later.

Exported network configurations include:

- Network name.
- Router IDs and display labels.
- Router positions.
- Link endpoints.
- Link costs.
- Enabled or disabled connection states.

Imported files are validated before being applied.

No backend or database is required.

### 9. Algorithm Comparison

Compare Dijkstra's and Bellman-Ford algorithms side by side.

The comparison includes:

- Shortest-path costs.
- Algorithmic approaches.
- Theoretical time complexities.
- Related networking concepts.
- Corresponding routing-protocol families.

Both algorithms calculate the same minimum cost for supported positive-weight graphs, although equally optimal paths may differ.

### 10. Simulation Event Log

Track important actions performed within the simulator.

Events include:

- Router and link creation.
- Topology modifications.
- Routing calculations.
- Link failures and restoration.
- Packet transmission and delivery.
- Network resets and imports.

The log stores the latest 50 simulation events with timestamps and status indicators.

---

## Tech Stack

| Technology | Purpose |
|---|---|
| React | Interactive user interface |
| Vite | Frontend build and development tooling |
| JavaScript | Graph algorithms and application logic |
| React Flow (`@xyflow/react`) | Interactive network visualization |
| CSS | Interface styling and responsive layouts |
| HTML5 File APIs | JSON import and export |
| `requestAnimationFrame` | Simulated packet animation |

RouteLab runs entirely in the browser without a backend server or database.

## System Architecture

```text
                      RouteLab 2.1
                           |
                React User Interface
                           |
          +----------------+----------------+
          |                |                |
    Network Editor    Routing Engine   Visualization
          |                |                |
     Routers/Links    Graph Builder     React Flow
          |                |                |
     JSON Storage     +-----+-----+     Packet Journey
                      |           |
                  Dijkstra   Bellman-Ford
                      |           |
                      +-----+-----+
                            |
                    Routing Results
                            |
                +-----------+-----------+
                |           |           |
            Shortest      Routing     Algorithm
              Path         Table      Comparison
```

### How It Works

1. Users create or select a network topology.
2. The application represents routers as vertices and connections as weighted edges.
3. Inactive connections are excluded from the active graph.
4. The selected routing algorithm calculates shortest paths.
5. The application generates routing tables and highlights the selected route.
6. Users can simulate packet movement or introduce network failures.
7. Routing results are updated based on the modified topology.

---

## Routing Algorithms

### Dijkstra's Algorithm

Dijkstra's algorithm repeatedly selects the unvisited router with the smallest tentative distance and relaxes its outgoing edges.

**Time complexity (linear-selection implementation):**

`O(V² + E)`

With an appropriate priority queue, a commonly used optimized implementation can achieve `O((V + E) log V)`.

### Bellman-Ford Algorithm

Bellman-Ford repeatedly relaxes graph edges to determine shortest paths from the source.

**Time complexity:**

`O(V × E)`

Although Bellman-Ford can support negative weights theoretically, RouteLab restricts link costs to positive values.

### Dijkstra vs Bellman-Ford

| Property | Dijkstra | Bellman-Ford |
|---|---|---|
| Approach | Greedy | Repeated relaxation |
| Negative weights | Not generally supported | Supported theoretically |
| Time complexity | O(V² + E) in this implementation | O(VE) |
| Associated routing approach | Link-state | Distance-vector |
| Example protocol | OSPF | RIP |

*RouteLab implements graph algorithms for educational purposes. It does not implement the complete distributed OSPF or RIP protocols.*

---

## Example: Shortest-Path Calculation

Consider the following network:

| Connection | Cost |
|---|---:|
| A–B | 4 |
| A–C | 2 |
| B–C | 1 |
| B–D | 5 |
| C–D | 8 |
| C–E | 10 |
| D–E | 2 |

**Source:** A  
**Destination:** E

The shortest path is:

`A → C → B → D → E`

Total cost:

`2 + 1 + 5 + 2 = 10`

### Link Failure Simulation

If link B–D becomes unavailable, the simulator recalculates the route.

**New shortest path:**

`A → C → E`

**New total cost:**

`2 + 10 = 12`

Restoring B–D allows the original minimum-cost route to be selected again.

This demonstrates how shortest-path calculations respond to network topology changes.

---

## Installation & Setup

### Prerequisites

- Node.js and npm
- Git
- A modern web browser

### 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd RouteLab
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start the Development Server

```bash
npm run dev
```

Open the local address displayed in your terminal, typically:

`http://localhost:5173/`

### 4. Run Automated Tests

```bash
npm test
```

### 5. Create a Production Build

```bash
npm run build
```

### 6. Preview the Production Build

```bash
npm run preview
```

---

## How to Use RouteLab

1. Select a predefined topology or click **New Network** to create a custom topology.
2. Add routers and connect them using weighted links.
3. Select Dijkstra or Bellman-Ford.
4. Choose source and destination routers using dropdowns or canvas selection.
5. Click **Find Shortest Path**.
6. Examine the calculated route, cost, and routing table.
7. Click **Send Packet** to visualize packet movement.
8. Disable a link and observe automatic rerouting.
9. Open Algorithm Steps, Compare Algorithms, or Event Log to explore the results.
10. Export your custom network to JSON for later use.

---

## Screenshots

<img width="1919" height="941" alt="image" src="https://github.com/user-attachments/assets/13f2e216-4d3d-4cbe-b4c5-b217e9f49ec7" />
<img width="1170" height="860" alt="image" src="https://github.com/user-attachments/assets/b639d90a-6840-42e4-a1c6-97a85a2b24d8" />
<img width="1919" height="938" alt="image" src="https://github.com/user-attachments/assets/a2584f14-0264-4cec-9f78-10b514e35f3a" />
<img width="1916" height="579" alt="image" src="https://github.com/user-attachments/assets/23368976-c657-4319-af98-220dd2cc4c72" />
<img width="1918" height="371" alt="image" src="https://github.com/user-attachments/assets/91209ea5-d5fe-4f1c-88ec-4cc0b37427ed" />
<img width="388" height="461" alt="image" src="https://github.com/user-attachments/assets/2e302501-f7f3-41b5-b5ab-e3e46f7b59b2" />

## Testing & Verification

The project includes automated tests covering:

- Shortest-path correctness.
- Equal-cost alternative paths.
- Disconnected networks.
- Routing table generation.
- Dynamic topology modifications.
- Link failure and rerouting.
- Network presets.
- Dijkstra step tracing.
- Bellman-Ford calculations.
- JSON serialization and validation.
- Custom network operations.

**Latest reported verification:** 190 automated tests passed, with zero reported failures.

Production builds and browser workflows have also been checked during development.

---

## Limitations

RouteLab is an educational simulation tool and has the following boundaries:

- Routing calculations execute centrally in the browser.
- It does not exchange real OSPF or RIP protocol messages.
- Links are undirected and have symmetric costs.
- Link weights are user-defined abstract routing metrics.
- Packet movement is animated rather than transmitted through real network interfaces.
- The event log records simulated application events, not real network traffic.
- Network configurations are saved and restored through JSON files rather than a database.

These constraints help keep the simulator lightweight, accessible, and focused on fundamental routing concepts.

## Future Scope

Possible future enhancements include:

- Directed network connections.
- Additional routing metrics.
- Visual comparison of more routing algorithms.
- More advanced packet forwarding simulations.
- Network congestion and queue management.
- Support for larger network topologies.

---

## Project Documentation

Additional documentation is available in the `docs/` directory:

| Document | Description |
|---|---|
| `PROJECT_REPORT.md` | Academic project report |
| `VIVA_GUIDE.md` | Networking concepts and viva preparation |
| `DEMO_SCRIPT.md` | Step-by-step project demonstration |

---

## Author

**Guransh Singh**

B.Tech — Computer Science and Engineering  
Netaji Subhas University of Technology (NSUT), Delhi

---

## Acknowledgment

Developed as a Computer Networks mini-project to explore shortest-path routing, graph algorithms, routing-table generation, and network failure recovery through interactive visualization.

---

**RouteLab 2.1 — Learn routing by building networks.**
