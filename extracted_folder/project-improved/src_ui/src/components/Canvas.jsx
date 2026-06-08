import React, { useCallback, useRef, useState, useEffect } from 'react';
import ReactFlow, {
  Background, Controls, useNodesState, useEdgesState, addEdge, MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';

import InputNode          from './nodes/inputNode';
import FilterNode         from './nodes/filterNode';
import WithColumnNode     from './nodes/withColumnNode';
import DropColumnsNode    from './nodes/dropColumnsNode';
import SelectColumnsNode  from './nodes/selectColumnsNode';
import RenameColumnNode   from './nodes/renameColumnNode';
import CastNode           from './nodes/castNode';
import SortNode           from './nodes/sortNode';
import DedupNode          from './nodes/dedupNode';
import SqlNode            from './nodes/sqlNode';
import JoinNode           from './nodes/joinNode';
import SplitNode          from './nodes/splitNode';
import UnionNode          from './nodes/unionNode';
import OutputNode         from './nodes/outputNode';

const NODE_TYPES = {
  inputNode: InputNode, filterNode: FilterNode, withColumnNode: WithColumnNode,
  dropColumnsNode: DropColumnsNode, selectColumnsNode: SelectColumnsNode,
  renameColumnNode: RenameColumnNode, castNode: CastNode, sortNode: SortNode,
  dedupNode: DedupNode, sqlNode: SqlNode, joinNode: JoinNode,
  splitNode: SplitNode, unionNode: UnionNode, outputNode: OutputNode,
};

const EDGE_DEF = {
  type: 'smoothstep',
  style: { stroke: '#94a3b8', strokeWidth: 2 },
  markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8', width: 13, height: 13 },
};

let ctr = 0;
const uid = () => `n_${Date.now()}_${ctr++}`;

const EmptyState = () => (
  <div className="canvas-empty">
    <div className="canvas-empty-icon">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="3" width="8" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
        <rect x="14" y="3" width="8" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
        <rect x="8" y="16" width="8" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M10 5.5h4M22 5.5v6l-10 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    </div>
    <h3>Canvas vazio</h3>
    <p>Arraste blocos do carrossel acima para começar</p>
  </div>
);

export default function Canvas({ setRfInstance, onFlowChange, onAnyChange, onNodeFocus, clearSignal, loadSignal, onLoadDone }) {
  const wrapRef = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [rf, setRfLocal] = useState(null);

  useEffect(() => { onFlowChange?.(nodes, edges); }, [nodes, edges]);

  useEffect(() => {
    if (clearSignal > 0) { setNodes([]); setEdges([]); }
  }, [clearSignal]);

  useEffect(() => {
    if (loadSignal && rf) {
      setNodes((loadSignal.nodes ?? []).map(n => ({ ...n, selected: false, data: { ...n.data, onAliasChange: undefined } })));
      setEdges(loadSignal.edges ?? []);
      if (loadSignal.viewport) rf.setViewport(loadSignal.viewport);
      onLoadDone?.();
    }
  }, [loadSignal, rf]);

  const updateAlias = useCallback((nodeId, alias) => {
    setNodes(ns => ns.map(n => n.id === nodeId ? { ...n, data: { ...n.data, alias } } : n));
    onAnyChange?.();
  }, [setNodes, onAnyChange]);

  // Keep alias callback fresh in all node data
  useEffect(() => {
    setNodes(ns => ns.map(n => ({ ...n, data: { ...n.data, onAliasChange: updateAlias } })));
  }, [updateAlias]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('application/reactflow');
    if (!type || !rf) return;
    const b = wrapRef.current.getBoundingClientRect();
    const position = rf.project({ x: e.clientX - b.left, y: e.clientY - b.top });
    const id = uid();
    setNodes(ns => ns.concat({ id, type, position, data: { onAliasChange: updateAlias } }));
    onAnyChange?.();
  }, [rf, updateAlias, setNodes, onAnyChange]);

  const onDragOver = useCallback(e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }, []);
  const onConnect = useCallback(p => { setEdges(es => addEdge({ ...p, ...EDGE_DEF }, es)); onAnyChange?.(); }, [setEdges, onAnyChange]);

  const onNodeClick = useCallback((_, node) => {
    // pass the live node from state
    const live = nodes.find(n => n.id === node.id) ?? node;
    onNodeFocus?.(live);
  }, [nodes, onNodeFocus]);

  const onPaneClick = useCallback(() => onNodeFocus?.(null), [onNodeFocus]);

  const onInit = useCallback(inst => {
    setRfLocal(inst);
    setRfInstance?.(inst);
  }, [setRfInstance]);

  return (
    <div className="canvas-wrapper" ref={wrapRef}>
      {nodes.length === 0 && <EmptyState />}
      <ReactFlow
        nodes={nodes} edges={edges}
        onNodesChange={c => { onNodesChange(c); onAnyChange?.(); }}
        onEdgesChange={c => { onEdgesChange(c); onAnyChange?.(); }}
        onConnect={onConnect} onInit={onInit}
        onDrop={onDrop} onDragOver={onDragOver}
        nodeTypes={NODE_TYPES}
        onNodeClick={onNodeClick} onPaneClick={onPaneClick}
        defaultEdgeOptions={EDGE_DEF}
        fitView snapToGrid snapGrid={[12,12]}
        deleteKeyCode="Delete" elevateEdgesOnSelect
      >
        <Background color="#c5d0de" gap={20} size={1.5} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
