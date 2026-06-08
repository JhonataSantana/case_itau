import React from 'react';

export default function Topbar({ pipelineName, onNameChange, onSave, onCompile, onOpen, onClear, saveStatus, nodeCount, edgeCount }) {
  return (
    <header className="topbar">
      <div className="topbar-brand">
        <div className="brand-icon">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M3 5h3M3 8h10M3 11h6" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
            <circle cx="12" cy="5" r="1.6" fill="white"/>
            <circle cx="11" cy="11" r="1.6" fill="white"/>
          </svg>
        </div>
        <span className="brand-name">DataFlow</span>
      </div>
      <div className="topbar-sep" />
      <input className="pipeline-input" value={pipelineName} onChange={e => onNameChange(e.target.value)} spellCheck={false} />
      <div className="status-badge">
        <div className={`status-dot ${saveStatus}`} />
        {saveStatus === 'saved' ? 'Guardado' : 'Não guardado'}
      </div>
      {nodeCount > 0 && <span className="stat-chip">{nodeCount}b · {edgeCount}c</span>}
      <div style={{ flex: 1 }} />
      <div className="topbar-actions">
        <button className="btn" onClick={onOpen}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M2 5h5l1.5 1.5H14V13H2V5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg>
          Abrir
        </button>
        <button className="btn" onClick={onClear}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 4h10M5 4V3h6v1M4 4l.5 9h7L12 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Limpar
        </button>
        <div className="topbar-sep" />
        <button className="btn btn-green" onClick={onCompile}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M4.5 4L2 8l2.5 4M11.5 4L14 8l-2.5 4" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 3l-2 10" stroke="white" strokeWidth="1.4" strokeLinecap="round"/></svg>
          Compilar PySpark
        </button>
        <button className="btn btn-primary" onClick={onSave} title="Ctrl+S">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M2 2h9.5L14 4.5V14H2V2z" stroke="white" strokeWidth="1.4" strokeLinejoin="round"/><rect x="4.5" y="9" width="7" height="5" rx=".5" stroke="white" strokeWidth="1.4"/><rect x="5" y="2" width="5" height="3" rx=".5" stroke="white" strokeWidth="1.4"/></svg>
          Guardar
        </button>
      </div>
    </header>
  );
}
