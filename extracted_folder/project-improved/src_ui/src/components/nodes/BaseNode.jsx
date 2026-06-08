// BaseNode.jsx — shared skeleton for all canvas nodes
import React, { useState, useRef, useCallback } from 'react';
import { Handle, Position } from 'reactflow';

export default function BaseNode({
  id, data,
  color, defaultLabel, icon: Icon,
  // handle config
  targetHandles,   // [{id, style, label, labelStyle}] – custom left handles
  sourceHandles,   // [{id, style, label, labelStyle}] – custom right handles
  hasTarget = true,
  hasSource = true,
}) {
  const [editing, setEditing] = useState(false);
  const alias = data.alias || defaultLabel;
  const inputRef = useRef(null);

  const startEdit = useCallback((e) => {
    e.stopPropagation();
    setEditing(true);
    requestAnimationFrame(() => { inputRef.current?.select(); });
  }, []);

  const commit = useCallback((val) => {
    setEditing(false);
    const trimmed = (val || '').trim() || defaultLabel;
    if (data.onAliasChange) data.onAliasChange(id, trimmed);
  }, [id, data, defaultLabel]);

  const handleKey = (e) => {
    if (e.key === 'Enter') commit(e.target.value);
    if (e.key === 'Escape') { setEditing(false); }
  };

  const nodeStyle = { '--node-color': color };

  return (
    <div className="df-node" style={nodeStyle} title="Duplo-clique no nome para renomear">
      {/* coloured accent bar */}
      <div className="df-node-accent" />

      {/* icon */}
      <div className="df-node-icon-wrap">
        <div className="df-node-icon">
          {Icon && <Icon />}
        </div>
      </div>

      {/* label / alias */}
      <div className="df-node-body">
        {editing ? (
          <input
            ref={inputRef}
            className="df-node-alias-input"
            defaultValue={alias}
            onBlur={(e) => commit(e.target.value)}
            onKeyDown={handleKey}
          />
        ) : (
          <span className="df-node-label" onDoubleClick={startEdit}>{alias}</span>
        )}
      </div>

      {/* default left handle */}
      {hasTarget && !targetHandles && (
        <Handle type="target" position={Position.Left}
          style={{ background: '#94a3b8', border: '2px solid white' }} />
      )}
      {/* custom left handles */}
      {targetHandles?.map((h) => (
        <React.Fragment key={h.id}>
          <Handle type="target" id={h.id} position={Position.Left}
            style={{ ...h.style, border: '2px solid white' }} />
          {h.label && (
            <span className="hnd-label" style={{ left: -18, top: `calc(${h.style?.top || '50%'} - 7px)`, ...h.labelStyle }}>
              {h.label}
            </span>
          )}
        </React.Fragment>
      ))}

      {/* default right handle */}
      {hasSource && !sourceHandles && (
        <Handle type="source" position={Position.Right}
          style={{ background: color, border: '2px solid white' }} />
      )}
      {/* custom right handles */}
      {sourceHandles?.map((h) => (
        <React.Fragment key={h.id}>
          <Handle type="source" id={h.id} position={Position.Right}
            style={{ background: color, ...h.style, border: '2px solid white' }} />
          {h.label && (
            <span className="hnd-label" style={{ right: -16, top: `calc(${h.style?.top || '50%'} - 7px)`, ...h.labelStyle }}>
              {h.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
