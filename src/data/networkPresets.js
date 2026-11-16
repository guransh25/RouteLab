/**
 * networkPresets.js — RouteLab 2.0
 * Predefined network scenarios for teaching and demonstrations.
 *
 * Presets:
 *   1. basic   – Standard 5-router lab topology (A–E)
 *   2. ring    – 6-router ring network (A–F)
 *   3. campus  – University campus network (Admin, Academic, Lab, Library, Hostel)
 */

export const PRESETS = {
  basic: {
    id: 'basic',
    name: 'Basic Network (5 Routers)',
    description: 'Standard lab topology with cross-connections and alternate paths',
    nodes: [
      { id: 'A', type: 'routerNode', position: { x: 100, y: 220 }, data: { label: 'A' } },
      { id: 'B', type: 'routerNode', position: { x: 320, y: 80 },  data: { label: 'B' } },
      { id: 'C', type: 'routerNode', position: { x: 320, y: 360 }, data: { label: 'C' } },
      { id: 'D', type: 'routerNode', position: { x: 540, y: 80 },  data: { label: 'D' } },
      { id: 'E', type: 'routerNode', position: { x: 540, y: 360 }, data: { label: 'E' } },
    ],
    edges: [
      { id: 'A-B', source: 'A', target: 'B', label: '4', data: { cost: 4, failed: false, enabled: true } },
      { id: 'A-C', source: 'A', target: 'C', label: '2', data: { cost: 2, failed: false, enabled: true } },
      { id: 'B-C', source: 'B', target: 'C', label: '1', data: { cost: 1, failed: false, enabled: true } },
      { id: 'B-D', source: 'B', target: 'D', label: '5', data: { cost: 5, failed: false, enabled: true } },
      { id: 'C-D', source: 'C', target: 'D', label: '8', data: { cost: 8, failed: false, enabled: true } },
      { id: 'C-E', source: 'C', target: 'E', label: '10', data: { cost: 10, failed: false, enabled: true } },
      { id: 'D-E', source: 'D', target: 'E', label: '2', data: { cost: 2, failed: false, enabled: true } },
    ],
  },

  ring: {
    id: 'ring',
    name: 'Ring Network (6 Routers)',
    description: 'Circular ring topology demonstrating bidirectional alternate routing',
    nodes: [
      { id: 'A', type: 'routerNode', position: { x: 320, y: 60 },  data: { label: 'A' } },
      { id: 'B', type: 'routerNode', position: { x: 520, y: 160 }, data: { label: 'B' } },
      { id: 'C', type: 'routerNode', position: { x: 520, y: 360 }, data: { label: 'C' } },
      { id: 'D', type: 'routerNode', position: { x: 320, y: 460 }, data: { label: 'D' } },
      { id: 'E', type: 'routerNode', position: { x: 120, y: 360 }, data: { label: 'E' } },
      { id: 'F', type: 'routerNode', position: { x: 120, y: 160 }, data: { label: 'F' } },
    ],
    edges: [
      { id: 'A-B', source: 'A', target: 'B', label: '3', data: { cost: 3, failed: false, enabled: true } },
      { id: 'B-C', source: 'B', target: 'C', label: '4', data: { cost: 4, failed: false, enabled: true } },
      { id: 'C-D', source: 'C', target: 'D', label: '2', data: { cost: 2, failed: false, enabled: true } },
      { id: 'D-E', source: 'D', target: 'E', label: '5', data: { cost: 5, failed: false, enabled: true } },
      { id: 'E-F', source: 'E', target: 'F', label: '3', data: { cost: 3, failed: false, enabled: true } },
      { id: 'F-A', source: 'F', target: 'A', label: '4', data: { cost: 4, failed: false, enabled: true } },
    ],
  },

  campus: {
    id: 'campus',
    name: 'Campus Network',
    description: 'Realistic university campus topology connecting key department routers',
    nodes: [
      { id: 'Admin',    type: 'routerNode', position: { x: 100, y: 220 }, data: { label: 'Admin' } },
      { id: 'Academic', type: 'routerNode', position: { x: 320, y: 90 },  data: { label: 'Academic' } },
      { id: 'Lab',      type: 'routerNode', position: { x: 550, y: 90 },  data: { label: 'Lab' } },
      { id: 'Library',  type: 'routerNode', position: { x: 320, y: 360 }, data: { label: 'Library' } },
      { id: 'Hostel',   type: 'routerNode', position: { x: 550, y: 360 }, data: { label: 'Hostel' } },
    ],
    edges: [
      { id: 'Admin-Academic', source: 'Admin',    target: 'Academic', label: '2', data: { cost: 2, failed: false, enabled: true } },
      { id: 'Admin-Library',  source: 'Admin',    target: 'Library',  label: '4', data: { cost: 4, failed: false, enabled: true } },
      { id: 'Academic-Lab',   source: 'Academic', target: 'Lab',      label: '1', data: { cost: 1, failed: false, enabled: true } },
      { id: 'Academic-Library', source: 'Academic', target: 'Library', label: '3', data: { cost: 3, failed: false, enabled: true } },
      { id: 'Library-Hostel', source: 'Library',  target: 'Hostel',   label: '5', data: { cost: 5, failed: false, enabled: true } },
      { id: 'Lab-Hostel',     source: 'Lab',      target: 'Hostel',   label: '7', data: { cost: 7, failed: false, enabled: true } },
      { id: 'Admin-Hostel',   source: 'Admin',    target: 'Hostel',   label: '9', data: { cost: 9, failed: false, enabled: true } },
    ],
  },
}
