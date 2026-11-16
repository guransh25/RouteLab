/**
 * Header.jsx — RouteLab 2.1
 * Top application bar: branding, topology switcher, New Network, and actions.
 *
 * Props:
 *   currentPreset      – 'basic' | 'ring' | 'campus' | 'custom'
 *   customNetworkName  – string (display name for custom topologies)
 *   onSelectPreset     – (presetId) => void
 *   onOpenNewNetwork   – () => void
 *   onReset            – callback to restore default or initial network state
 *   onExport           – callback to export network to JSON
 *   onImport           – (jsonString) => void
 */

import { useRef } from 'react'
import { Network, Layers, Download, Upload, PlusCircle } from 'lucide-react'

function Header({
  currentPreset = 'basic',
  customNetworkName = 'Custom Network',
  onSelectPreset,
  onOpenNewNetwork,
  onReset,
  onExport,
  onImport,
}) {
  const fileInputRef = useRef(null)

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
      fileInputRef.current.click()
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result
      if (typeof content === 'string' && onImport) {
        onImport(content)
      }
    }
    reader.readAsText(file)
  }

  return (
    <header className="app-header">
      <div className="app-header__brand">
        <Network size={20} strokeWidth={1.8} className="app-header__icon" />
        <div>
          <h1 className="app-header__title">RouteLab 2.1</h1>
          <p className="app-header__subtitle">Custom Network Design &amp; Interactive Simulation</p>
        </div>
      </div>

      <div className="app-header__actions">
        {/* Preset topology scenario selector */}
        <div className="app-header__preset">
          <Layers size={14} strokeWidth={1.8} className="app-header__preset-icon" />
          <label htmlFor="header-preset-select" className="app-header__preset-label">
            Topology:
          </label>
          <select
            id="header-preset-select"
            className="app-header__select"
            value={currentPreset}
            onChange={(e) => {
              if (e.target.value === '__new__') {
                onOpenNewNetwork?.()
              } else {
                onSelectPreset?.(e.target.value)
              }
            }}
          >
            <option value="basic">Basic Network (5 Routers)</option>
            <option value="ring">Ring Network (6 Routers)</option>
            <option value="campus">Campus Network</option>
            {currentPreset === 'custom' && (
              <option value="custom">Custom Network ({customNetworkName || 'Custom'})</option>
            )}
            <option value="__new__">+ New Custom Network...</option>
          </select>
        </div>

        {/* New Network action */}
        <button
          className="btn btn--outline btn--sm"
          onClick={onOpenNewNetwork}
          title="Create a new blank custom network"
        >
          <PlusCircle size={13} strokeWidth={2} />
          New Network
        </button>

        {/* Network Save and Load actions (Phase 7) */}
        <button
          className="btn btn--outline btn--sm"
          onClick={onExport}
          title="Export network topology to JSON file"
        >
          <Download size={13} strokeWidth={2} />
          Export
        </button>

        <button
          className="btn btn--outline btn--sm"
          onClick={handleImportClick}
          title="Import network topology from JSON file"
        >
          <Upload size={13} strokeWidth={2} />
          Import
        </button>

        <input
          type="file"
          ref={fileInputRef}
          accept=".json,application/json"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        <button className="btn btn--outline btn--sm" onClick={onReset}>
          Reset Network
        </button>
      </div>
    </header>
  )
}

export default Header
