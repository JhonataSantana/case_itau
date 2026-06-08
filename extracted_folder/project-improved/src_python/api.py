# src_python/api.py
"""
API EEL — DataFlow Builder Engine
Expõe funções Python ao frontend React via window.eel.*
"""

import eel
import json
import os
from datetime import datetime
from .compiler import compilar_pipeline as _compilar

# ──────────────────────────────────────────────────────────
# Caminhos base
# ──────────────────────────────────────────────────────────
BASE_DIR      = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR      = os.path.join(BASE_DIR, "data")
PIPELINES_DIR = os.path.join(DATA_DIR, "Pipelines")
BASES_DIR     = os.path.join(DATA_DIR, "Bases_Padrao")
USUARIOS_DIR  = os.path.join(DATA_DIR, "Bases_Usuarios")


def _ok(mensagem="OK", **kwargs):
    return {"status": "sucesso", "mensagem": mensagem, **kwargs}

def _err(mensagem="Erro", **kwargs):
    return {"status": "erro", "mensagem": mensagem, **kwargs}


# ──────────────────────────────────────────────────────────
# Sistema / Diagnóstico
# ──────────────────────────────────────────────────────────

@eel.expose
def ping_backend():
    return _ok("Conexão com o motor Python estabelecida com sucesso!")


# ──────────────────────────────────────────────────────────
# Bases de Dados
# ──────────────────────────────────────────────────────────

@eel.expose
def listar_bases():
    """Lê catalogo_geral.json e devolve as bases disponíveis."""
    try:
        catalogo_path = os.path.join(BASES_DIR, "catalogo_geral.json")
        if not os.path.exists(catalogo_path):
            return _ok("Catálogo não encontrado.", bases=[])

        with open(catalogo_path, "r", encoding="utf-8") as f:
            dados = json.load(f)

        bases = dados.get("bases_disponiveis", [])

        # Enriquecer com metadados se existirem
        bases_enriquecidas = []
        for b in bases:
            meta_path = os.path.join(BASES_DIR, b.get("id", ""), "metadados.json")
            if os.path.exists(meta_path):
                with open(meta_path, "r", encoding="utf-8") as mf:
                    meta = json.load(mf)
                b = {**b, **meta}
            bases_enriquecidas.append(b)

        return _ok(bases=bases_enriquecidas)
    except Exception as e:
        return _err(f"Erro ao listar bases: {e}")


@eel.expose
def obter_metadados_base(base_id: str):
    """Retorna o contrato de metadados de uma base específica."""
    try:
        meta_path = os.path.join(BASES_DIR, base_id, "metadados.json")
        if not os.path.exists(meta_path):
            return _err(f"Metadados não encontrados para a base '{base_id}'.")
        with open(meta_path, "r", encoding="utf-8") as f:
            return _ok(metadados=json.load(f))
    except Exception as e:
        return _err(str(e))


# ──────────────────────────────────────────────────────────
# Gestão de Pipelines
# ──────────────────────────────────────────────────────────

@eel.expose
def listar_pipelines():
    """Lista todos os pipelines guardados na pasta Pipelines/."""
    try:
        os.makedirs(PIPELINES_DIR, exist_ok=True)
        pipelines = []
        for nome in sorted(os.listdir(PIPELINES_DIR)):
            config_path = os.path.join(PIPELINES_DIR, nome, "pipeline_config.json")
            if not os.path.isfile(config_path):
                continue
            try:
                with open(config_path, "r", encoding="utf-8") as f:
                    cfg = json.load(f)
                script_path = os.path.join(PIPELINES_DIR, nome, "script_pyspark_glue.py")
                pipelines.append({
                    "id":                  cfg.get("pipeline_id", nome),
                    "nome":                cfg.get("nome",         nome),
                    "ultima_modificacao":  cfg.get("ultima_modificacao", ""),
                    "versao_engine":       cfg.get("versao_engine", ""),
                    "tem_script":          os.path.isfile(script_path),
                    "n_nodes":             len(cfg.get("grafo", {}).get("nodes", [])),
                    "n_edges":             len(cfg.get("grafo", {}).get("edges", [])),
                })
            except Exception:
                pass
        return _ok(pipelines=pipelines)
    except Exception as e:
        return _err(f"Erro ao listar pipelines: {e}")


@eel.expose
def guardar_pipeline(pipeline_nome: str, dados_grafo: dict):
    """Persiste o JSON do grafo e gera o script PySpark."""
    try:
        pipeline_path = os.path.join(PIPELINES_DIR, pipeline_nome)
        os.makedirs(pipeline_path, exist_ok=True)

        dados_grafo["ultima_modificacao"] = datetime.now().isoformat()

        config_file = os.path.join(pipeline_path, "pipeline_config.json")
        with open(config_file, "w", encoding="utf-8") as f:
            json.dump(dados_grafo, f, ensure_ascii=False, indent=2)

        # Compila automaticamente ao guardar
        codigo = _compilar(dados_grafo.get("grafo", {}), nome_pipeline=pipeline_nome)
        script_file = os.path.join(pipeline_path, "script_pyspark_glue.py")
        with open(script_file, "w", encoding="utf-8") as f:
            f.write(codigo)

        return _ok(f"Pipeline '{pipeline_nome}' guardado e script PySpark gerado com sucesso!")
    except Exception as e:
        return _err(f"Erro ao guardar pipeline: {e}")


@eel.expose
def carregar_pipeline(pipeline_nome: str):
    """Carrega o JSON de um pipeline guardado."""
    try:
        config_path = os.path.join(PIPELINES_DIR, pipeline_nome, "pipeline_config.json")
        if not os.path.exists(config_path):
            return _err(f"Pipeline '{pipeline_nome}' não encontrado.")
        with open(config_path, "r", encoding="utf-8") as f:
            dados = json.load(f)
        return _ok(dados=dados)
    except Exception as e:
        return _err(f"Erro ao carregar pipeline: {e}")


@eel.expose
def apagar_pipeline(pipeline_nome: str):
    """Remove a pasta de um pipeline."""
    import shutil
    try:
        pipeline_path = os.path.join(PIPELINES_DIR, pipeline_nome)
        if not os.path.exists(pipeline_path):
            return _err(f"Pipeline '{pipeline_nome}' não encontrado.")
        shutil.rmtree(pipeline_path)
        return _ok(f"Pipeline '{pipeline_nome}' apagado.")
    except Exception as e:
        return _err(str(e))


@eel.expose
def compilar_pipeline(pipeline_nome: str, dados_grafo: dict):
    """Compila o grafo em PySpark sem guardar (preview do código)."""
    try:
        grafo = dados_grafo.get("grafo", dados_grafo)
        codigo = _compilar(grafo, nome_pipeline=pipeline_nome)

        # Guardar se existir a pasta
        pipeline_path = os.path.join(PIPELINES_DIR, pipeline_nome)
        if os.path.exists(pipeline_path):
            script_file = os.path.join(pipeline_path, "script_pyspark_glue.py")
            with open(script_file, "w", encoding="utf-8") as f:
                f.write(codigo)
            mensagem = f"Script PySpark gerado em:\nPipelines/{pipeline_nome}/script_pyspark_glue.py"
        else:
            mensagem = "Script compilado (pasta do pipeline não existe ainda; guarda primeiro)."

        return _ok(mensagem, codigo=codigo)
    except Exception as e:
        return _err(f"Erro na compilação: {e}")


# ──────────────────────────────────────────────────────────
# Preview de Dados (PySpark local)
# ──────────────────────────────────────────────────────────

@eel.expose
def obter_preview_dados(node_id: str, fluxo_atual: dict):
    """
    Executa o fluxo até ao nó indicado numa sessão PySpark local
    e devolve as primeiras linhas para visualização.
    """
    print(f"[Python] Preview solicitado: nó '{node_id}'")
    try:
        # ── Tentativa com PySpark local ──
        try:
            from pyspark.sql import SparkSession
            spark = (SparkSession.builder
                     .master("local[2]")
                     .appName("DataFlow_Preview")
                     .config("spark.driver.memory", "1g")
                     .getOrCreate())
            spark.sparkContext.setLogLevel("ERROR")

            nodes   = {n["id"]: n for n in fluxo_atual.get("nodes", [])}
            edges   = fluxo_atual.get("edges", [])
            parent_map = {nid: [] for nid in nodes}
            for edge in edges:
                parent_map[edge["target"]].append(edge["source"])

            # Execução simplificada até ao nó alvo
            dfs = {}
            visited = set()

            def processar(nid):
                if nid in visited:
                    return
                for pai in parent_map.get(nid, []):
                    processar(pai)
                visited.add(nid)
                node  = nodes[nid]
                tipo  = node.get("type")
                dados = node.get("data", {})
                pais  = parent_map.get(nid, [])
                df_in = dfs.get(pais[0]) if pais else None

                if tipo == "inputNode":
                    base = dados.get("base", "")
                    path = os.path.join(BASE_DIR, "data", "Bases_Padrao", base, "dados_referencia.csv")
                    if os.path.exists(path):
                        dfs[nid] = spark.read.csv(path, header=True, inferSchema=True)
                elif tipo == "filterNode" and df_in is not None:
                    dfs[nid] = df_in.filter(dados.get("condicao", "1=1"))
                elif tipo == "transformNode" and df_in is not None:
                    from pyspark.sql.functions import expr
                    col_name = dados.get("coluna", "nova_coluna")
                    expressao = dados.get("expressao", "null")
                    dfs[nid] = df_in.withColumn(col_name, expr(expressao))
                elif tipo == "groupByNode" and df_in is not None:
                    from pyspark.sql.functions import expr
                    ag = dados.get("coluna_agrupamento", "")
                    fn = dados.get("funcao", "count('*')")
                    dfs[nid] = df_in.groupBy(ag).agg(expr(fn))
                elif tipo == "sqlNode" and df_in is not None:
                    df_in.createOrReplaceTempView("tabela_entrada")
                    dfs[nid] = spark.sql(dados.get("query", "SELECT * FROM tabela_entrada"))
                elif tipo == "joinNode":
                    df_l = dfs.get(pais[0]) if pais else None
                    df_r = dfs.get(pais[1]) if len(pais) > 1 else None
                    if df_l and df_r:
                        dfs[nid] = df_l.join(df_r, on=dados.get("chave", "id"), how=dados.get("tipo_join", "inner"))
                elif df_in is not None:
                    dfs[nid] = df_in

            processar(node_id)
            df_result = dfs.get(node_id)
            if df_result is None:
                raise ValueError("Não foi possível processar o nó solicitado.")

            df_limited = df_result.limit(50)
            colunas = df_limited.columns
            tipos   = [str(f.dataType.simpleString()) for f in df_limited.schema.fields]
            linhas  = [[str(v) if v is not None else None for v in row] for row in df_limited.collect()]

            return _ok(dados={"colunas": colunas, "tipos": tipos, "linhas": linhas})

        except ImportError:
            # PySpark não disponível — usa dados de amostra do CSV
            pass

        # ── Fallback: ler CSV de amostra directamente ──
        nodes  = {n["id"]: n for n in fluxo_atual.get("nodes", [])}
        node   = nodes.get(node_id, {})
        dados  = node.get("data", {})
        base   = dados.get("base", "")
        csv_path = os.path.join(BASE_DIR, "data", "Bases_Padrao", base, "dados_referencia.csv")

        if os.path.exists(csv_path):
            import csv
            with open(csv_path, "r", encoding="utf-8") as f:
                reader = csv.reader(f)
                colunas = next(reader)
                linhas  = [row for _, row in zip(range(50), reader)]
            return _ok(dados={"colunas": colunas, "tipos": ["string"] * len(colunas), "linhas": linhas})

        # ── Dados simulados genéricos ──
        import time; time.sleep(0.5)
        return _ok(dados={
            "colunas": ["id", "nome", "categoria", "valor", "data"],
            "tipos":   ["integer", "string", "string", "double", "date"],
            "linhas": [
                [1, "Produto Alpha",  "Software", 250.00, "2024-01-10"],
                [2, "Monitor 27\"",   "Hardware", 1200.00, "2024-02-15"],
                [3, "Teclado Mec.",   "Hardware",  450.00, "2024-03-01"],
                [4, "Office 365",     "Software",  350.00, "2024-03-05"],
                [5, "Headset Gamer",  "Hardware",  320.00, "2024-03-10"],
            ],
        })

    except Exception as e:
        print(f"[Python] Erro no preview: {e}")
        return _err(str(e))
