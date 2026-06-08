import sys
from awsglue.transforms import *
from awsglue.utils import getResolvedOptions
from pyspark.context import SparkContext
from awsglue.context import GlueContext
from awsglue.job import Job

## Configuração Inicial do Glue
sc = SparkContext.getOrCreate()
glueContext = GlueContext(sc)
spark = glueContext.spark_session
job = Job(glueContext)
job.init('dataflow_builder_job', args={})

## Início do Fluxo de Dados processado visualmente

# Processando etapa: bloco_0 (inputNode)
df_bloco_0 = spark.read.format('parquet').load('s3://meu-data-lake/tabela_padrao/')

# Processando etapa: bloco_1 (sqlNode)
df_bloco_0.createOrReplaceTempView('tabela_entrada')
df_bloco_1 = spark.sql("""""")

## Finalização
job.commit()