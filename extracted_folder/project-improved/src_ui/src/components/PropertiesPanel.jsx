import React, { useState, useEffect, useCallback } from 'react';
import { BLOCK_MAP } from './nodes/index';

const MOCK_META = {
  Vendas: {
    nome: 'Vendas_Corporativo', descricao: 'Histórico completo de transações de vendas corporativas.',
    n_registos: 15420, ultima_atualizacao: '2024-03-21',
    colunas: [
      { nome: 'id_venda',   tipo: 'integer', descricao: 'Identificador único da venda' },
      { nome: 'id_cliente', tipo: 'integer', descricao: 'FK → Clientes' },
      { nome: 'id_produto', tipo: 'integer', descricao: 'FK → Produtos' },
      { nome: 'valor',      tipo: 'double',  descricao: 'Valor bruto em R$' },
      { nome: 'quantidade', tipo: 'integer', descricao: 'Unidades vendidas' },
      { nome: 'data_venda', tipo: 'date',    descricao: 'Data da transação' },
      { nome: 'status',     tipo: 'string',  descricao: 'APROVADO, CANCELADO, PENDENTE' },
      { nome: 'canal',      tipo: 'string',  descricao: 'LOJA, ONLINE, PARCEIRO' },
    ],
  },
  Clientes: {
    nome: 'Clientes_Master', descricao: 'Cadastro master de clientes ativos e inativos.',
    n_registos: 4820, ultima_atualizacao: '2024-03-01',
    colunas: [
      { nome: 'id_cliente',   tipo: 'integer', descricao: 'Identificador único' },
      { nome: 'nome',         tipo: 'string',  descricao: 'Nome completo' },
      { nome: 'cidade',       tipo: 'string',  descricao: 'Cidade de residência' },
      { nome: 'estado',       tipo: 'string',  descricao: 'UF (2 letras)' },
      { nome: 'status',       tipo: 'string',  descricao: 'ATIVO ou INATIVO' },
      { nome: 'data_cadastro',tipo: 'date',    descricao: 'Data de criação' },
    ],
  },
  Produtos: {
    nome: 'Produtos_Catalogo', descricao: 'Catálogo de produtos e serviços.',
    n_registos: 312, ultima_atualizacao: '2024-02-10',
    colunas: [
      { nome: 'id_produto', tipo: 'integer', descricao: 'Identificador único' },
      { nome: 'nome',       tipo: 'string',  descricao: 'Nome comercial' },
      { nome: 'categoria',  tipo: 'string',  descricao: 'Categoria principal' },
      { nome: 'preco',      tipo: 'double',  descricao: 'Preço de tabela em R$' },
      { nome: 'ativo',      tipo: 'boolean', descricao: 'Produto em linha' },
    ],
  },
};

const BASES_LIST = [
  { id: '', label: 'Selecione a base…', disabled: true },
  { id: 'Vendas',   label: 'Vendas_Corporativo',  group: 'Padrão' },
  { id: 'Clientes', label: 'Clientes_Master',     group: 'Padrão' },
  { id: 'Produtos', label: 'Produtos_Catalogo',   group: 'Padrão' },
];

const TIPOS_SPARK = ['string','integer','long','double','float','boolean','date','timestamp','array','map'];

function ColTag({ tipo }) {
  return <span className={`col-type ${TYPE_CLASS[tipo] || 'type-string'}`}>{tipo}</span>;
}
const TYPE_CLASS = {
  integer: 'type-integer', long: 'type-integer', double: 'type-double',
  float: 'type-float', string: 'type-string', date: 'type-date',
  timestamp: 'type-timestamp', boolean: 'type-boolean',
};

function MetaPanel({ meta }) {
  if (!meta) return null;
  return (
    <div className="meta-box">
      <div className="meta-desc">{meta.descricao}</div>
      <div className="meta-stat">
        <strong>{meta.n_registos?.toLocaleString('pt-BR')}</strong> registos ·{' '}
        atualizado em <strong>{meta.ultima_atualizacao}</strong>
      </div>
      <div className="section-title" style={{ marginTop: 8 }}>Colunas ({meta.colunas?.length})</div>
      <div className="col-list">
        {meta.colunas?.map(col => (
          <div className="col-row" key={col.nome}>
            <span className="col-name">{col.nome}</span>
            <ColTag tipo={col.tipo} />
            {col.descricao && <span className="col-desc">{col.descricao}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PropertiesPanel({ node, onUpdate, onClose }) {
  const [meta, setMeta] = useState(null);

  const data  = node?.data   || {};
  const type  = node?.type   || '';
  const alias = data.alias;
  const bmap  = BLOCK_MAP[type] || {};
  const NodeIcon = bmap.Icon || null;

  const set = useCallback((k, v) => onUpdate?.(node.id, k, v), [node?.id, onUpdate]);

  // load metadata when base changes
  useEffect(() => {
    if (type !== 'inputNode' || !data.base) { setMeta(null); return; }
    if (window.eel) {
      window.eel.obter_metadados_base(data.base)((r) => {
        if (r?.status === 'sucesso') setMeta(r.metadados);
      });
    } else {
      setMeta(MOCK_META[data.base] || null);
    }
  }, [type, data.base]);

  if (!node) {
    return (
      <aside className="props-panel">
        <div className="props-empty">
          <div className="props-empty-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
              <rect x="11" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
              <rect x="2" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
              <rect x="11" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
            </svg>
          </div>
          <p>Clique num bloco no canvas para ver e editar as suas propriedades</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="props-panel">
      <div className="props-header">
        <div className="props-hicon" style={{ background: bmap.color || '#94a3b8' }}>
          {NodeIcon && <NodeIcon />}
        </div>
        <span className="props-htitle">{alias || bmap.label || type}</span>
        <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', alignItems: 'center', padding: 2 }}>
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </button>
      </div>

      <div className="props-body">
        {/* ── Alias / Rename ── */}
        <div className="props-section">
          <div className="section-title">Identificação</div>
          <div className="form-row">
            <label className="form-label">Apelido do bloco</label>
            <input
              className="form-input"
              value={alias || ''}
              onChange={e => set('alias', e.target.value)}
              placeholder={bmap.label || type}
            />
            <span className="form-hint">Duplo-clique no canvas também renomeia.</span>
          </div>
        </div>

        {/* ── Node-specific config ── */}
        <div className="props-section">
          <div className="section-title">Configuração</div>

          {/* inputNode */}
          {type === 'inputNode' && (
            <>
              <div className="form-row">
                <label className="form-label">Base de dados</label>
                <select className="form-select" value={data.base || ''} onChange={e => set('base', e.target.value)}>
                  {BASES_LIST.map(b => <option key={b.id} value={b.id} disabled={!!b.disabled}>{b.label}</option>)}
                </select>
              </div>
              {meta && <MetaPanel meta={meta} />}
            </>
          )}

          {/* filterNode */}
          {type === 'filterNode' && (
            <div className="form-row">
              <label className="form-label">Condição (WHERE)</label>
              <input className="form-input mono-input" value={data.condicao || ''} onChange={e => set('condicao', e.target.value)} placeholder="status = 'ATIVO'" />
              <span className="form-hint">Expressão SQL ou PySpark: col('x') &gt; 0, status.isin([…])</span>
            </div>
          )}

          {/* withColumnNode */}
          {type === 'withColumnNode' && (
            <>
              <div className="form-row">
                <label className="form-label">Nome da nova coluna</label>
                <input className="form-input mono-input" value={data.coluna || ''} onChange={e => set('coluna', e.target.value)} placeholder="valor_total" />
              </div>
              <div className="form-row">
                <label className="form-label">Expressão</label>
                <input className="form-input mono-input" value={data.expressao || ''} onChange={e => set('expressao', e.target.value)} placeholder="col('qtd') * col('preco')" />
                <span className="form-hint">col(), lit(), when(), coalesce(), to_date()…</span>
              </div>
            </>
          )}

          {/* dropColumnsNode */}
          {type === 'dropColumnsNode' && (
            <div className="form-row">
              <label className="form-label">Colunas a remover</label>
              <input className="form-input mono-input" value={data.colunas || ''} onChange={e => set('colunas', e.target.value)} placeholder="col1, col2, col3" />
              <span className="form-hint">Nomes separados por vírgula.</span>
            </div>
          )}

          {/* selectColumnsNode */}
          {type === 'selectColumnsNode' && (
            <div className="form-row">
              <label className="form-label">Colunas a manter</label>
              <input className="form-input mono-input" value={data.colunas || ''} onChange={e => set('colunas', e.target.value)} placeholder="id, nome, valor" />
              <span className="form-hint">Nomes separados por vírgula. Apenas estas serão mantidas.</span>
            </div>
          )}

          {/* renameColumnNode */}
          {type === 'renameColumnNode' && (
            <>
              <div className="form-row">
                <label className="form-label">Coluna original</label>
                <input className="form-input mono-input" value={data.coluna_original || ''} onChange={e => set('coluna_original', e.target.value)} placeholder="nome_antigo" />
              </div>
              <div className="form-row">
                <label className="form-label">Novo nome</label>
                <input className="form-input mono-input" value={data.coluna_nova || ''} onChange={e => set('coluna_nova', e.target.value)} placeholder="nome_novo" />
              </div>
            </>
          )}

          {/* castNode */}
          {type === 'castNode' && (
            <>
              <div className="form-row">
                <label className="form-label">Coluna</label>
                <input className="form-input mono-input" value={data.coluna || ''} onChange={e => set('coluna', e.target.value)} placeholder="valor" />
              </div>
              <div className="form-row">
                <label className="form-label">Tipo destino</label>
                <select className="form-select" value={data.tipo_destino || 'string'} onChange={e => set('tipo_destino', e.target.value)}>
                  {TIPOS_SPARK.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </>
          )}

          {/* sortNode */}
          {type === 'sortNode' && (
            <>
              <div className="form-row">
                <label className="form-label">Coluna(s) de ordenação</label>
                <input className="form-input mono-input" value={data.colunas_sort || ''} onChange={e => set('colunas_sort', e.target.value)} placeholder="data_venda, valor" />
              </div>
              <div className="form-row">
                <label className="form-label">Ordem</label>
                <select className="form-select" value={data.ordem || 'asc'} onChange={e => set('ordem', e.target.value)}>
                  <option value="asc">Ascendente (ASC)</option>
                  <option value="desc">Descendente (DESC)</option>
                </select>
              </div>
            </>
          )}

          {/* dedupNode */}
          {type === 'dedupNode' && (
            <div className="form-row">
              <label className="form-label">Subset de colunas (opcional)</label>
              <input className="form-input mono-input" value={data.subset || ''} onChange={e => set('subset', e.target.value)} placeholder="id_cliente, produto" />
              <span className="form-hint">Deixe vazio para dedup completo (todas as colunas).</span>
            </div>
          )}

          {/* sqlNode */}
          {type === 'sqlNode' && (
            <div className="form-row">
              <label className="form-label">Query Spark SQL</label>
              <textarea className="form-textarea" rows={8} value={data.query || ''} onChange={e => set('query', e.target.value)} placeholder={"SELECT *\nFROM tabela_entrada\nWHERE status = 'ATIVO'"} />
              <span className="form-hint">A entrada fica disponível como <code style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>tabela_entrada</code>.</span>
            </div>
          )}

          {/* joinNode */}
          {type === 'joinNode' && (
            <>
              <div className="form-row">
                <label className="form-label">Tipo de Junção</label>
                <select className="form-select" value={data.tipo_join || 'inner'} onChange={e => set('tipo_join', e.target.value)}>
                  {['inner','left','right','full','cross','semi','anti'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)} Join</option>)}
                </select>
              </div>
              <div className="form-row">
                <label className="form-label">Chave(s) de junção</label>
                <input className="form-input mono-input" value={data.chave || ''} onChange={e => set('chave', e.target.value)} placeholder="id_cliente" />
                <span className="form-hint">Handle A = esquerda, Handle B = direita.</span>
              </div>
            </>
          )}

          {/* splitNode */}
          {type === 'splitNode' && (
            <div className="form-row">
              <label className="form-label">Condição → rota T (true)</label>
              <input className="form-input mono-input" value={data.condicao_split || ''} onChange={e => set('condicao_split', e.target.value)} placeholder="status = 'ATIVO'" />
              <span className="form-hint">Registos que não cumprem vão para a rota F.</span>
            </div>
          )}

          {/* unionNode */}
          {type === 'unionNode' && (
            <div className="form-row">
              <label className="form-label">Modo de união</label>
              <select className="form-select" value={data.modo_union || 'union'} onChange={e => set('modo_union', e.target.value)}>
                <option value="union">Union (remove duplicatas)</option>
                <option value="unionAll">Union All (mantém todos)</option>
                <option value="unionByName">Union By Name (por nome de coluna)</option>
              </select>
            </div>
          )}

          {/* outputNode */}
          {type === 'outputNode' && (
            <>
              <div className="form-row">
                <label className="form-label">Formato de saída</label>
                <select className="form-select" value={data.formato || 'parquet'} onChange={e => set('formato', e.target.value)}>
                  {['parquet','csv','json','delta','orc'].map(f => <option key={f} value={f}>{f.charAt(0).toUpperCase()+f.slice(1)}{f==='parquet'?' (recomendado)':''}</option>)}
                </select>
              </div>
              <div className="form-row">
                <label className="form-label">Caminho destino (S3)</label>
                <input className="form-input mono-input" value={data.caminho || ''} onChange={e => set('caminho', e.target.value)} placeholder="s3://bucket/pasta/" />
              </div>
              <div className="form-row">
                <label className="form-label">Modo de escrita</label>
                <select className="form-select" value={data.modo || 'overwrite'} onChange={e => set('modo', e.target.value)}>
                  {['overwrite','append','ignore','error'].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </>
          )}
        </div>

        {/* node id */}
        <div style={{ marginTop: 12, padding: '8px 10px', borderRadius: 5, background: 'var(--bg-surface-2)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 9.5, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', marginBottom: 2 }}>ID DO BLOCO</div>
          <div style={{ fontSize: 10.5, color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>{node.id}</div>
        </div>
      </div>
    </aside>
  );
}
