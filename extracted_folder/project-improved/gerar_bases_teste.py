# gerar_bases_teste.py
import os
import json
import csv

BASE_DIR = os.path.join("data", "Bases_Padrao")

bases = {
    "Clientes": {
        "metadados": {"colunas": [{"nome": "id_cliente", "tipo": "integer"}, {"nome": "nome", "tipo": "string"}, {"nome": "cidade", "tipo": "string"}]},
        "dados": [
            {"id_cliente": 1, "nome": "Ana Silva", "cidade": "Lisboa"},
            {"id_cliente": 2, "nome": "Bruno Costa", "cidade": "Porto"},
            {"id_cliente": 3, "nome": "Carla Sousa", "cidade": "Faro"}
        ]
    },
    "Vendas": {
        "metadados": {"colunas": [{"nome": "id_venda", "tipo": "integer"}, {"nome": "id_cliente", "tipo": "integer"}, {"nome": "valor", "tipo": "double"}]},
        "dados": [
            {"id_venda": 101, "id_cliente": 1, "valor": 250.50},
            {"id_venda": 102, "id_cliente": 2, "valor": 120.00},
            {"id_venda": 103, "id_cliente": 1, "valor": 890.00}
        ]
    },
    "Produtos": {
        "metadados": {"colunas": [{"nome": "id_produto", "tipo": "integer"}, {"nome": "nome_produto", "tipo": "string"}, {"nome": "categoria", "tipo": "string"}]},
        "dados": [
            {"id_produto": 1, "nome_produto": "Licença Windows", "categoria": "Software"},
            {"id_produto": 2, "nome_produto": "Monitor Dell 27", "categoria": "Hardware"}
        ]
    }
}

os.makedirs(BASE_DIR, exist_ok=True)

catalogo = []

for nome_base, conteudo in bases.items():
    pasta_base = os.path.join(BASE_DIR, nome_base)
    os.makedirs(pasta_base, exist_ok=True)
    
    # 1. Cria o ficheiro metadados.json
    with open(os.path.join(pasta_base, "metadados.json"), "w", encoding="utf-8") as f:
        json.dump(conteudo["metadados"], f, indent=2)
        
    # 2. Cria o ficheiro de dados (CSV)
    with open(os.path.join(pasta_base, "dados_referencia.csv"), "w", newline='', encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=conteudo["dados"][0].keys())
        writer.writeheader()
        for linha in conteudo["dados"]:
            writer.writerow(linha)
            
    catalogo.append({"id": nome_base, "nome": nome_base})

# 3. Cria o Catálogo Geral
with open(os.path.join(BASE_DIR, "catalogo_geral.json"), "w", encoding="utf-8") as f:
    json.dump({"bases_disponiveis": catalogo}, f, indent=2)

print("✅ Bases de exemplo geradas com sucesso na pasta data/Bases_Padrao/")