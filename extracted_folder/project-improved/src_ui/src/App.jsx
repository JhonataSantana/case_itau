import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ReactFlowProvider } from 'reactflow';
import Topbar from './components/Topbar';
import NodeCarousel from './components/NodeCarousel';
import Canvas from './components/Canvas';
import PropertiesPanel from './components/PropertiesPanel';
import DataPreviewPanel from './components/DataPreviewPanel';
import './App.css';

// mock preview data per tab
const MOCK_ROWS = (n) => Array.from({length:n},(_,i)=>[i+101,`Cliente ${i+1}`,['ATIVO','INATIVO'][i%2],(Math.random()*1000).toFixed(2),`2024-0${(i%9)+1}-${(i%28)+1}`.padEnd(10,'0')]);
const COLS = ['id_cliente','nome','status','valor','data'];
const TIPOS = ['integer','string','string','double','date'];

export default function App() {
  const [rfInstance, setRfInstance]   = useState(null);
  const [pipelineName, setPipelineName] = useState('novo_pipeline');
  const [saveStatus, setSaveStatus]   = useState('saved');
  const [nodeCount, setNodeCount]     = useState(0);
  const [edgeCount, setEdgeCount]     = useState(0);
  const [clearSignal, setClearSignal] = useState(0);
  const [loadSignal, setLoadSignal]   = useState(null);
  const [focusedNode, setFocusedNode] = useState(null);   // the live node object
  const [previewData, setPreviewData] = useState(null);
  const pendingPreviewRef = useRef(null);

  // ── Update node data from PropertiesPanel ──
  const handleNodeUpdate = useCallback((nodeId, key, value) => {
    if (!rfInstance) return;
    rfInstance.setNodes(ns => ns.map(n =>
      n.id === nodeId ? { ...n, data: { ...n.data, [key]: value } } : n
    ));
    setSaveStatus('unsaved');
    // refresh focusedNode
    setFocusedNode(fn => fn?.id === nodeId ? { ...fn, data: { ...fn.data, [key]: value } } : fn);
  }, [rfInstance]);

  // ── Preview on node focus ──
  const handleNodeFocus = useCallback((node) => {
    setFocusedNode(node);
    if (!node) { setPreviewData(null); return; }

    const reqId = Symbol();
    pendingPreviewRef.current = reqId;
    setPreviewData({ nodeAlias: node.data?.alias || node.type, loading: true });

    const fluxo = rfInstance?.toObject?.() ?? {};

    const finish = ({ entrada, saida }) => {
      if (pendingPreviewRef.current !== reqId) return;
      setPreviewData({ nodeAlias: node.data?.alias || node.type, loading: false, entrada, saida });
    };

    if (window.eel) {
      window.eel.obter_preview_dados(node.id, fluxo)((r) => {
        if (r?.status === 'sucesso') {
          finish({ saida: r.dados, entrada: r.dados_entrada ?? r.dados });
        } else {
          finish({ saida: { colunas: [], tipos: [], linhas: [] }, entrada: { colunas: [], tipos: [], linhas: [] } });
        }
      });
    } else {
      setTimeout(() => finish({
        entrada: { colunas: COLS, tipos: TIPOS, linhas: MOCK_ROWS(5) },
        saida:   { colunas: COLS, tipos: TIPOS, linhas: MOCK_ROWS(3) },
      }), 600);
    }
  }, [rfInstance]);

  const handleSave = useCallback(() => {
    if (!rfInstance) return;
    const nome = pipelineName.trim().replace(/\s+/g,'_') || 'pipeline';
    const payload = { pipeline_id: nome, nome: pipelineName, ultima_modificacao: new Date().toISOString(), versao_engine: '1.0.0', grafo: rfInstance.toObject() };
    if (window.eel) {
      window.eel.guardar_pipeline(nome, payload)(r => { if (r?.status==='sucesso') setSaveStatus('saved'); else alert('Erro: '+r?.mensagem); });
    } else {
      localStorage.setItem(`dfb_${nome}`, JSON.stringify(payload));
      setSaveStatus('saved');
    }
  }, [rfInstance, pipelineName]);

  const handleCompile = useCallback(() => {
    if (!rfInstance) return;
    const nome = pipelineName.trim().replace(/\s+/g,'_') || 'pipeline';
    const payload = { pipeline_id: nome, grafo: rfInstance.toObject() };
    if (window.eel) {
      window.eel.compilar_pipeline(nome, payload)(r => { if (r?.status==='sucesso') alert('✅ '+r.mensagem); else alert('Erro: '+r?.mensagem); });
    } else {
      alert('[Dev] Compilar: ' + nome);
    }
  }, [rfInstance, pipelineName]);

  const handleClear = useCallback(() => {
    if (!window.confirm('Limpar canvas?')) return;
    setClearSignal(s => s+1);
    setFocusedNode(null); setPreviewData(null);
  }, []);

  const handleOpen = useCallback(() => {
    if (window.eel) {
      window.eel.listar_pipelines()(r => {
        if (!r?.pipelines?.length) { alert('Sem pipelines guardados.'); return; }
        const nome = window.prompt(r.pipelines.map(p=>p.nome).join('\n')+'\n\nNome:', r.pipelines[0].nome);
        if (!nome) return;
        window.eel.carregar_pipeline(nome)(r2 => {
          if (r2?.status==='sucesso') { setPipelineName(r2.dados.nome||nome); setLoadSignal(r2.dados.grafo); setSaveStatus('saved'); }
        });
      });
    } else {
      const keys = Object.keys(localStorage).filter(k=>k.startsWith('dfb_'));
      if (!keys.length) { alert('Sem pipelines (dev).'); return; }
      const nome = window.prompt(keys.map(k=>k.slice(4)).join('\n'), keys[0].slice(4));
      if (!nome) return;
      const d = JSON.parse(localStorage.getItem('dfb_'+nome)||'{}');
      setPipelineName(d.nome||nome); setLoadSignal(d.grafo); setSaveStatus('saved');
    }
  }, []);

  useEffect(() => {
    const h = e => { if ((e.ctrlKey||e.metaKey) && e.key==='s') { e.preventDefault(); handleSave(); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [handleSave]);

  return (
    <div className="app">
      <Topbar
        pipelineName={pipelineName} onNameChange={n=>{setPipelineName(n);setSaveStatus('unsaved');}}
        onSave={handleSave} onCompile={handleCompile} onClear={handleClear} onOpen={handleOpen}
        saveStatus={saveStatus} nodeCount={nodeCount} edgeCount={edgeCount}
      />
      <NodeCarousel />
      <div className="main-body">
        <PropertiesPanel
          node={focusedNode}
          onUpdate={handleNodeUpdate}
          onClose={() => setFocusedNode(null)}
        />
        <div className="canvas-area">
          <ReactFlowProvider>
            <Canvas
              setRfInstance={setRfInstance}
              onFlowChange={(ns,es)=>{setNodeCount(ns.length);setEdgeCount(es.length);}}
              onAnyChange={()=>setSaveStatus('unsaved')}
              onNodeFocus={handleNodeFocus}
              clearSignal={clearSignal}
              loadSignal={loadSignal}
              onLoadDone={()=>setLoadSignal(null)}
            />
          </ReactFlowProvider>
          <DataPreviewPanel previewData={previewData} onClose={()=>setPreviewData(null)} />
        </div>
      </div>
    </div>
  );
}
