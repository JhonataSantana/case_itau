# src_python/compiler.py
"""
Compilador PySpark — DataFlow Builder Engine
Traduz o grafo JSON do React Flow num script Python
pronto para execução em AWS Glue Jobs.
"""

from datetime import datetime


# ──────────────────────────────────────────────────────────
# Helpers internos
# ──────────────────────────────────────────────────────────

def _var(node_id: str, suffix: str = "") -> str:
    """Nome da variável Python para um nó. Ex: df_bloco_0 ou df_bloco_0_true"""
    safe = node_id.replace("-", "_")
    return f"df_{safe}{('_' + suffix) if suffix else ''}"


def _indent(lines: list, level: int = 1) -> list:
    pad = "    " * level
    return [pad + l for l in lines]


def _topological_sort(nodes: dict, parent_map: dict) -> list:
    """Ordenação topológica simples (DFS)."""
    visited, order = set(), []

    def visit(nid):
        if nid not in visited:
            for parent in parent_map.get(nid, []):
                visit(parent)
            visited.add(nid)
            order.append(nid)

    for nid in nodes:
        visit(nid)
    return order


# ──────────────────────────────────────────────────────────
# Geradores por tipo de nó
# ──────────────────────────────────────────────────────────

def _gen_input(node_id, dados, parent_map):
    base = dados.get("base", "").strip()
    linhas = []
    if not base:
        linhas.append(f"# ⚠️  ATENÇÃO: Nó Input '{node_id}' sem base selecionada.")
        linhas.append(f"{_var(node_id)} = spark.createDataFrame([], schema=None)  # placeholder")
        return linhas

    # Tenta ler do catálogo local; em produção usa s3://
    linhas.append(f"_caminho_{node_id} = f\"data/Bases_Padrao/{base}/dados_referencia.csv\"")
    linhas.append(
        f"{_var(node_id)} = ("
        f"spark.read"
        f".format(\"csv\")"
        f".option(\"header\", \"true\")"
        f".option(\"inferSchema\", \"true\")"
        f".load(_caminho_{node_id})"
        f")"
    )
    var = _var(node_id)
    linhas.append(f"print(f\"[Input] '{base}' carregado — {{{var}.count()}} registos\")")
    return linhas


def _gen_transform(node_id, dados, df_in):
    coluna    = dados.get("coluna",    "nova_coluna").strip() or "nova_coluna"
    expressao = dados.get("expressao", "lit(None)").strip()   or "lit(None)"
    return [
        f"from pyspark.sql.functions import col, lit, when, coalesce, to_date, to_timestamp, cast",
        f"{_var(node_id)} = {df_in}.withColumn(\"{coluna}\", {expressao})",
    ]


def _gen_filter(node_id, dados, df_in):
    condicao = dados.get("condicao", "1=1").strip() or "1=1"
    return [f"{_var(node_id)} = {df_in}.filter(\"{condicao}\")"]


def _gen_split(node_id, dados, df_in):
    condicao = dados.get("condicao_split", "1=1").strip() or "1=1"
    return [
        f"# Split — rota T: cumpre condição / rota F: não cumpre",
        f"{_var(node_id, 'true')}  = {df_in}.filter(\"{condicao}\")",
        f"{_var(node_id, 'false')} = {df_in}.filter(~({df_in}[\"{condicao.split()[0]}\"].isNotNull()))  # adaptado",
        f"# Nota: para rotas T/F use df_{node_id}_true e df_{node_id}_false nas arestas seguintes",
    ]


def _gen_join(node_id, dados, parent_map, nodes):
    pais      = parent_map.get(node_id, [])
    tipo      = dados.get("tipo_join", "inner")
    chave     = dados.get("chave",     "id").strip() or "id"
    df_left   = _var(pais[0]) if len(pais) > 0 else "df_UNDEFINED_LEFT"
    df_right  = _var(pais[1]) if len(pais) > 1 else "df_UNDEFINED_RIGHT"
    return [
        f"# Join {tipo.upper()} — esquerda: {pais[0] if pais else '?'} / direita: {pais[1] if len(pais)>1 else '?'}",
        f"{_var(node_id)} = {df_left}.join({df_right}, on=\"{chave}\", how=\"{tipo}\")",
    ]


def _gen_groupby(node_id, dados, df_in):
    agrupamento = dados.get("coluna_agrupamento", "").strip()
    funcao      = dados.get("funcao",             "count(\"*\")").strip() or "count(\"*\")"
    if not agrupamento:
        return [
            f"# ⚠️  GroupBy sem coluna de agrupamento definida — nó {node_id}",
            f"{_var(node_id)} = {df_in}  # pass-through até configuração",
        ]
    return [
        f"from pyspark.sql.functions import sum, count, avg, max, min, collect_list, first",
        f"{_var(node_id)} = {df_in}.groupBy(\"{agrupamento}\").agg({funcao})",
    ]


def _gen_sql(node_id, dados, df_in):
    query = dados.get("query", "SELECT * FROM tabela_entrada").strip()
    if not query:
        query = "SELECT * FROM tabela_entrada"
    view  = f"view_{node_id}"
    return [
        f"# SQL customizado — view temporária: {view}",
        f"{df_in}.createOrReplaceTempView(\"{view}\")",
        f"{_var(node_id)} = spark.sql(\"\"\"",
        *_indent(query.splitlines()),
        f"\"\"\")",
    ]


def _gen_output(node_id, dados, df_in):
    formato = dados.get("formato", "parquet")
    caminho = (dados.get("caminho") or f"s3://meu-data-lake/saida/{node_id}/").rstrip("/") + "/"
    modo    = dados.get("modo",    "overwrite")
    write_methods = {
        "parquet": f".parquet(\"{caminho}\")",
        "csv":     f".csv(\"{caminho}\", header=True)",
        "json":    f".json(\"{caminho}\")",
        "delta":   f".format(\"delta\").save(\"{caminho}\")",
        "orc":     f".orc(\"{caminho}\")",
    }
    write_call = write_methods.get(formato, f".format(\"{formato}\").save(\"{caminho}\")")
    return [
        f"print(\"[Output] Escrevendo em: {caminho}\")".format(),
        f"({df_in}",
        f"    .write",
        f"    .mode(\"{modo}\")",
        f"    {write_call}",
        f")",
        f"print(\"[Output] Escrita concluída.\")",
    ]


# ──────────────────────────────────────────────────────────
# Compilador principal
# ──────────────────────────────────────────────────────────

def _gen_with_column(node_id, dados, df_in):
    col_  = dados.get("coluna",    "nova_coluna").strip() or "nova_coluna"
    expr_ = dados.get("expressao", "lit(None)").strip()   or "lit(None)"
    return [
        "from pyspark.sql.functions import col, lit, when, coalesce, to_date, to_timestamp",
        f"{_var(node_id)} = {df_in}.withColumn(\"{col_}\", {expr_})",
    ]

def _gen_drop_columns(node_id, dados, df_in):
    raw  = dados.get("colunas", "").strip()
    cols = [x.strip() for x in raw.split(",") if x.strip()]
    if not cols:
        return [f"# ⚠️ dropColumns sem colunas definidas", f"{_var(node_id)} = {df_in}"]
    cols_py = ", ".join(f'"{c}"' for c in cols)
    return [f"{_var(node_id)} = {df_in}.drop({cols_py})"]

def _gen_select_columns(node_id, dados, df_in):
    raw  = dados.get("colunas", "").strip()
    cols = [x.strip() for x in raw.split(",") if x.strip()]
    if not cols:
        return [f"# ⚠️ selectColumns sem colunas definidas", f"{_var(node_id)} = {df_in}"]
    cols_py = ", ".join(f'"{c}"' for c in cols)
    return [f"{_var(node_id)} = {df_in}.select({cols_py})"]

def _gen_rename_column(node_id, dados, df_in):
    orig = dados.get("coluna_original", "").strip()
    nova = dados.get("coluna_nova",     "").strip()
    if not orig or not nova:
        return [f"# ⚠️ renameColumn incompleto", f"{_var(node_id)} = {df_in}"]
    return [f"{_var(node_id)} = {df_in}.withColumnRenamed(\"{orig}\", \"{nova}\")"]

def _gen_cast(node_id, dados, df_in):
    col_  = dados.get("coluna",       "").strip()
    tipo_ = dados.get("tipo_destino", "string").strip()
    if not col_:
        return [f"# ⚠️ cast sem coluna definida", f"{_var(node_id)} = {df_in}"]
    return [f"{_var(node_id)} = {df_in}.withColumn(\"{col_}\", {df_in}[\"{col_}\"].cast(\"{tipo_}\"))"]

def _gen_sort(node_id, dados, df_in):
    raw   = dados.get("colunas_sort", "").strip()
    cols  = [x.strip() for x in raw.split(",") if x.strip()]
    ordem = dados.get("ordem", "asc")
    if not cols:
        return [f"# ⚠️ sort sem colunas definidas", f"{_var(node_id)} = {df_in}"]
    from_fn = "from pyspark.sql import functions as F"
    cols_py = ", ".join(f'F.col(\"{c}\").{ordem}()' for c in cols)
    return [from_fn, f"{_var(node_id)} = {df_in}.orderBy({cols_py})"]

def _gen_dedup(node_id, dados, df_in):
    raw    = dados.get("subset", "").strip()
    subset = [x.strip() for x in raw.split(",") if x.strip()]
    if subset:
        cols_py = ", ".join(f'"{c}"' for c in subset)
        return [f"{_var(node_id)} = {df_in}.dropDuplicates([{cols_py}])"]
    return [f"{_var(node_id)} = {df_in}.distinct()"]

def _gen_union(node_id, dados, parent_map):
    pais  = parent_map.get(node_id, [])
    modo  = dados.get("modo_union", "union")
    df_l  = _var(pais[0]) if len(pais) > 0 else "df_NONE_LEFT"
    df_r  = _var(pais[1]) if len(pais) > 1 else "df_NONE_RIGHT"
    fn    = "unionByName" if modo == "unionByName" else "union"
    return [
        f"# União de bases: {pais[0] if pais else '?'} + {pais[1] if len(pais)>1 else '?'}",
        f"{_var(node_id)} = {df_l}.{fn}({df_r})",
    ]


def compilar_pipeline(grafo_json: dict, nome_pipeline: str = "dataflow_pipeline") -> str:
    """
    Recebe o estado do React Flow (nodes + edges) e devolve
    um script PySpark/Glue completo como string.
    """
    nodes_list = grafo_json.get("nodes", [])
    edges_list  = grafo_json.get("edges", [])

    if not nodes_list:
        return "# Pipeline vazio — sem nós para compilar."

    nodes      = {n["id"]: n for n in nodes_list}
    parent_map = {nid: [] for nid in nodes}
    edge_map   = {}  # target_handle → source_id

    for edge in edges_list:
        src, tgt, src_h, tgt_h = (
            edge.get("source"), edge.get("target"),
            edge.get("sourceHandle"), edge.get("targetHandle"),
        )
        if src and tgt:
            parent_map[tgt].append(src)
            edge_map[(tgt, tgt_h)] = src

    exec_order = _topological_sort(nodes, parent_map)

    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    lines = [
        "# ============================================================",
        f"# Pipeline: {nome_pipeline}",
        f"# Gerado por: DataFlow Builder Engine",
        f"# Data: {ts}",
        "# ============================================================",
        "",
        "import sys",
        "from awsglue.transforms import *",
        "from awsglue.utils import getResolvedOptions",
        "from pyspark.context import SparkContext",
        "from awsglue.context import GlueContext",
        "from awsglue.job import Job",
        "from pyspark.sql import functions as F",
        "from pyspark.sql.types import *",
        "",
        "# ── Inicialização do Glue Job ──",
        "args = getResolvedOptions(sys.argv, [\"JOB_NAME\"])",
        "sc = SparkContext.getOrCreate()",
        "glueContext = GlueContext(sc)",
        "spark = glueContext.spark_session",
        "job = Job(glueContext)",
        f"job.init(\"{nome_pipeline}\", args)",
        "",
        "# ── Início do Fluxo de Dados ──",
    ]

    for node_id in exec_order:
        node   = nodes[node_id]
        tipo   = node.get("type")
        dados  = node.get("data", {})
        pais   = parent_map.get(node_id, [])

        # Determina o df de entrada principal
        df_in = _var(pais[0]) if pais else "df_NONE"

        # Para join, resolve as entradas pelos handles
        if tipo == "joinNode":
            left_src  = edge_map.get((node_id, "left_table"),  pais[0] if pais else None)
            right_src = edge_map.get((node_id, "right_table"), pais[1] if len(pais) > 1 else None)
            if left_src:  parent_map[node_id] = ([left_src, right_src] if right_src else [left_src])

        lines.append("")
        lines.append(f"# ── Bloco: {node_id} ({tipo}) ──")

        try:
            if tipo == "inputNode":
                lines += _gen_input(node_id, dados, parent_map)
            elif tipo == "transformNode":
                lines += _gen_transform(node_id, dados, df_in)
            elif tipo == "filterNode":
                lines += _gen_filter(node_id, dados, df_in)
            elif tipo == "withColumnNode":
                lines += _gen_with_column(node_id, dados, df_in)
            elif tipo == "dropColumnsNode":
                lines += _gen_drop_columns(node_id, dados, df_in)
            elif tipo == "selectColumnsNode":
                lines += _gen_select_columns(node_id, dados, df_in)
            elif tipo == "renameColumnNode":
                lines += _gen_rename_column(node_id, dados, df_in)
            elif tipo == "castNode":
                lines += _gen_cast(node_id, dados, df_in)
            elif tipo == "sortNode":
                lines += _gen_sort(node_id, dados, df_in)
            elif tipo == "dedupNode":
                lines += _gen_dedup(node_id, dados, df_in)
            elif tipo == "unionNode":
                lines += _gen_union(node_id, dados, parent_map)
            elif tipo == "splitNode":
                lines += _gen_split(node_id, dados, df_in)
            elif tipo == "joinNode":
                lines += _gen_join(node_id, dados, parent_map, nodes)
            elif tipo == "groupByNode":
                lines += _gen_groupby(node_id, dados, df_in)
            elif tipo == "sqlNode":
                lines += _gen_sql(node_id, dados, df_in)
            elif tipo == "outputNode":
                lines += _gen_output(node_id, dados, df_in)
            else:
                lines.append(f"# ⚠️  Tipo de nó desconhecido: '{tipo}' — ignorado.")
        except Exception as e:
            lines.append(f"# ❌ Erro ao compilar nó {node_id}: {e}")

    lines += [
        "",
        "# ── Finalização ──",
        "job.commit()",
        "print(\"[Glue] Job concluído com sucesso.\")",
    ]

    return "\n".join(lines)
