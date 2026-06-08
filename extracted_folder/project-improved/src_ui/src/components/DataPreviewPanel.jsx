import React, { useState } from 'react';

const TYPE_COLOR = {
  integer: 'type-integer', long: 'type-integer',
  double: 'type-double', float: 'type-float',
  string: 'type-string', date: 'type-date',
  timestamp: 'type-timestamp', boolean: 'type-boolean',
};

function Table({ colunas, tipos, linhas }) {
  if (!colunas?.length) return <div className="preview-loading"><span className="preview-spinner"/>A processar dados...</div>;
  return (
    <table className="preview-table">
      <thead>
        <tr>
          {colunas.map((c, i) => (
            <th key={i}>{c}{tipos?.[i] && <span className="col-type-hint">{tipos[i]}</span>}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {linhas.map((row, ri) => (
          <tr key={ri}>
            {row.map((cell, ci) => (
              <td key={ci}>{cell === null || cell === undefined ? <span className="td-null">null</span> : String(cell)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function DataPreviewPanel({ previewData, onClose }) {
  const [tab, setTab] = useState('saida');
  if (!previewData) return null;

  const { nodeAlias, loading, entrada, saida } = previewData;
  const current = tab === 'entrada' ? entrada : saida;

  return (
    <div className="preview-panel">
      <div className="preview-bar">
        <div className="preview-tabs">
          {['entrada', 'saida'].map(t => (
            <button key={t} className={`preview-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
              {t === 'entrada' ? '↙ Entrada' : '↗ Saída'}
            </button>
          ))}
        </div>
        {nodeAlias && <span className="preview-node-tag">{nodeAlias}</span>}
        {!loading && current?.linhas && (
          <span className="preview-count">{current.linhas.length} linhas</span>
        )}
        <button className="preview-close" onClick={onClose} title="Fechar preview">
          <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
            <path d="M1.5 1.5l11 11M12.5 1.5l-11 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
      <div className="preview-body">
        {loading
          ? <div className="preview-loading"><div className="preview-spinner"/>A computar preview...</div>
          : <Table {...(current || {})} />
        }
      </div>
    </div>
  );
}
