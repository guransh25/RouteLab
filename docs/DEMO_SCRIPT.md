# RouteLab — 3–4 Minute Live Project Demonstration Script

**Target Audience**: Viva Examiner / Project Evaluation Panel  
**Estimated Time**: ~3 minutes 30 seconds  
**Presenters**: Student Project Team  

---

### Step 1: Introduction (0:00 – 0:30)

> *"Good morning, esteemed examiners. Today we are excited to present **RouteLab — Interactive Network Routing Simulator**.*
>
> *In Computer Networks, routing protocols like OSPF calculate the shortest path across a network to deliver packets efficiently. However, understanding Dijkstra’s algorithm and how routers construct their internal routing tables is usually taught purely on blackboards or static worksheets.*
>
> *We built RouteLab as a visual, interactive laboratory tool that allows students and instructors to see routing algorithms and link failures operating in real time right in the browser."*

---

### Step 2: Explaining Routers, Connections, and Costs (0:30 – 1:00)

> *(Action: Point to the main network canvas)*
>
> *"Here on the canvas, we have a network of 5 routers labeled A through E. In graph theory terms, routers are vertices, and the communication cables connecting them are weighted, undirected edges.*
>
> *Every link has a visible metric badge—for example, link A-C has a cost of 2, while A-B has a cost of 4. In a real network, this cost represents delay or inverse bandwidth.*
>
> *All routers can be smoothly repositioned or dragged, and the controls on the left let us add new routers, create custom links, or modify existing costs."*

---

### Step 3: Calculating Shortest Path from A to E (1:00 – 1:40)

> *(Action: In the sidebar, select Source = "A", Destination = "E", then click "Find Shortest Path")*
>
> *"Now let's calculate the shortest route from router A to router E.*
>
> *Notice that upon clicking 'Find Shortest Path', RouteLab executes our pure JavaScript implementation of Dijkstra’s algorithm.*
>
> *The canvas immediately highlights the optimal route in green: **A → C → B → D → E**.*
>
> *Notice that the total cost is **10** ($2 + 1 + 5 + 2$). You might ask: why didn't the packet go directly from C to E? Because the direct link C-E has a cost of 10, making the total path $2 + 10 = 12$. Going through intermediate hops B and D costs only 10, so Dijkstra correctly chooses the 4-hop path over the 2-hop path."*

---

### Step 4: Simulating the Packet Journey (1:40 – 2:05)

> *(Action: Click the "Send Packet" button in the sidebar)*
>
> *"Now we click **Send Packet** to simulate the transmission of a data packet along this optimal path.*
>
> *Watch as the amber packet marker smoothly glides hop-by-hop from router A to C, C to B, B to D, and finally D to E.*
>
> *Notice that the bottom panel tracks each hop in real time: 'Hop 1 of 4', 'Hop 2 of 4', up to 'Packet delivered successfully', while the active edge lights up during transmission. This visually reinforces how store-and-forward routing operates at each intermediate router."*

---

### Step 5: Inspecting the Routing Table (2:05 – 2:30)

> *(Action: Direct the panel's attention to the bottom-right Routing Table)*
>
> *"At the bottom right, we see the generated Routing Table for our Source router A. In networking, a router does not need to know the entire path to forward a packet; it only needs to know the **Next Hop**.*
>
> *Looking at destination E: the Next Hop is **C**, because C is the immediate neighbor that A must hand the packet to.*
>
> *Every row clearly lists the Destination, Next Hop, Minimum Metric, and Full Path Sequence, with row E highlighted in blue to match our current query."*

---

### Step 6: Simulating a Link Failure & Automatic Rerouting (2:30 – 3:00)

> *(Action: Click link B–D on the canvas, then click "Disable Link" in the sidebar)*
>
> *"Now comes the core fault-tolerance demonstration: simulating a physical link failure—such as an accidental fiber cut or router port failure.*
>
> *I will click link B-D and select **Disable Link**.*
>
> *Observe three immediate changes:*
> 1. *Link B-D is now styled as a dashed red line to signify it is down.*
> 2. *RouteLab **automatically reroutes**! The shortest path instantly switches to **A → C → E**, with the total cost updating to **12**.*
> 3. *A status banner reports: 'Link B–D disabled. New route: A → C → E (cost 12)' and destination E's cost updates to 12 dynamically.*
> 4. *When we click 'Send Packet' again, the packet marker takes the new 2-hop route directly through C to E!"*

---

### Step 7: Restoring the Link & Exploring Scenarios (3:00 – 3:20)

> *(Action: Click "Enable Link", then show the Scenario dropdown with Ring and Campus networks)*
>
> *"When maintenance repairs the cable, I click **Enable Link**.*
>
> *Immediately, the link restores to a solid line, Dijkstra recalculates, and the network converges back to the optimal route **A → C → B → D → E** at cost **10**.*
>
> *Furthermore, RouteLab includes pre-configured **Ring Network** and **Campus Network** scenarios, allowing students to explore alternative topologies such as university department backbones and ring protection with a single click."*

---

### Step 8: Step-by-Step Dijkstra Trace & Algorithm Comparison (3:20 – 3:45)

> *(Action: Click "Algorithm Steps" in the results panel, advance through Next Step, then toggle "Compare Algorithms")*
>
> *"Next, we demonstrate two advanced educational features:*
> 1. ***Algorithm Steps Explorer**: Clicking 'Algorithm Steps' lets us walk through Dijkstra's execution one router at a time. Watch as clicking 'Next Step' highlights router A, then C, then B in purple on the canvas, showing the exact tentative distance relaxation and predecessor tree building in real time.*
> 2. ***Routing Algorithm Comparison**: In the sidebar, we can toggle between **Dijkstra's Algorithm** (Link-State, as used in OSPF) and the **Bellman-Ford Algorithm** (Distance-Vector, associated with RIP). Clicking 'Compare Algorithms' displays a side-by-side comparison confirming path parity ($cost = 8$) while contrasting their computational complexity—$O(|V|^2 + |E|)$ versus $O(|V| \cdot |E|)$. We also clarify that BGP is a path-vector protocol, and that RouteLab simulates graph-level path calculations rather than raw distributed packet exchanges.*

---

### Step 9: Custom Network Design & Interactive Packet Mode (3:45 – 4:10)

> *(Action: Click "New Network" in the header, create "Enterprise WAN", add 3 routers, rename A to "Gateway", add links, and use "Select on Canvas")*
>
> *"In RouteLab 2.1, we introduced custom network design from scratch:*
> 1. *Clicking **New Network** creates a blank canvas, presenting a helpful empty-state indicator.*
> 2. *We can add routers, rename them with custom display labels like 'Gateway' or 'Core-Switch' while preserving stable internal IDs, and connect them with custom positive weights.*
> 3. *Notice our new **Select on Canvas** mode: instead of dropdowns, we simply click router Gateway on the canvas for Source, and router Server for Destination. RouteLab automatically calculates the optimal route immediately upon selecting the destination! We then click **Send Packet** to transmit.*
> 4. *Furthermore, the **Simulation Event Log** in the results panel provides a real-time chronological record of every topology modification, route recalculation, and packet delivery milestone."*

---

### Step 10: Network Save & Load (4:10 – 4:25)

> *(Action: Point to Export and Import buttons in the top header)*
>
> *"Finally, students and instructors can save their custom topologies using **Export**, which downloads a formatted JSON file preserving node coordinates, display labels, metrics, and disabled link states. Clicking **Import** restores saved networks with schema validation against duplicate links, negative costs, or malformed payloads—making homework assignments and lab tests easy to share."*

---

### Step 11: Real-World Relevance & Conclusion (4:25 – 4:40)

> *(Action: Click "Reset Network" to show clean reset functionality)*
>
> *"In summary, RouteLab 2.1 demonstrates:
> 1. Graph-theoretic modeling and custom topology design from scratch.
> 2. Step-by-step Dijkstra shortest-path calculations and tentative distance visualization.
> 3. Algorithmic comparison between Link-State (OSPF) and Distance-Vector (RIP) approaches.
> 4. Dynamic routing table construction and next-hop resolution.
> 5. Interactive canvas selection, real-time event logging, fault tolerance, packet animation, and JSON persistence.
>
> RouteLab provides an intuitive, accessible foundation for mastering the fundamental algorithms of computer networks.
>
> Thank you, and we welcome your questions!"*
