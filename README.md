# Case Itaú - Validador de Senhas 
Esta API valida senhas com base em critérios específicos de segurança.

## Execução do Projeto
1. Clone o repositório
2. Instale as dependências
3. Execute a aplicação

```bash
git clone https://github.com/JhonataSantana/case_itau
cd <NOME_DO_DIRETORIO>
npm install
node app.js
```

Para rodar os testes use
```bash
npm test
```

## Estrutura da API
```bash
.
├── app.js
├── passwordValidator.js
├── tests
│   └── passwordValidator.test.js
└── package.json
```

A API consiste basicamente por 2 algoritmos, sendo um deles para definir a função de validação das senhas e o outro para expôr a API em si. A validação conta com testes unitários.

#### Arquivo 'passwordValidator.js'
```javascript
// A função deve receber uma string
function isValidPassword(password) {
    // Verifica se a senha informada contém pelo menos 9 dígitos
    if (password.length < 9) {
        return false;
    // Verifica se a senha informada contém pelo menos 1 número   
    if (!/[0-9]/.test(password)) {
        return false;
    }
    // Verifica se a senha informada contém pelo menos 1 letra minúscula
    if (!/[a-z]/.test(password)) {
        return false;
    }
    // Verifica se a senha informada contém pelo menos 1 letra maiúscula
    if (!/[A-Z]/.test(password)) {
        return false;
    }
    // Verifica se a senha informada contém pelo menos 1 caractere especial (caracteres definidos no enunciado)
    if (!/[!@#$%^&*()-+]/.test(password)) {
        return false;
    }
    // Verifica se a senha informada contém dígitos repetidos
    if (new Set(password).size !== password.length) {
        return false;
    }
    // Verifica se a senha informada contém espaços em branco
    if (/\s/.test(password)) {
        return false;
    }
    return true;
}

// Exporta a função de validação 'isValidPassword'
module.exports = isValidPassword;
```

A maioria das validações de caracteres foram feitas utilizando RegEx, facilitando a checagem da existência de conjuntos de caracteres e alguns caracteres específicos. Sem o uso de RegEx seria necessário elaborar mais algoritmos, incluindo alguns loops e a definição dos conjuntos manualmente.

A única validação que não utiliza RegEx é a de caracteres repetidos, onde a função Set do Javascript cria uma coleção de valores únicos, por isso a verificação do tamanho de cada valor, caso tenha algum caractere repetido o Set irá eliminá-lo.

#### Arquivo 'app.js'
```javascript
// Requisição/Importação das bibliotecas/classes/funções necessárias
const express = require('express');
const bodyParser = require('body-parser');
const isValidPassword = require('./passwordValidator');

// Cria uma instância do Express
const app = express();
// Define a leitura do corpo da requisição como JSON
app.use(bodyParser.json());

// Define um rota da API como POST, sendo o endpoint '/validate_password'
app.post('/validate_password', (req, res) => {
    // Captura a senha recebida no JSON do corpo da requisição através do valor de 'password'
    const password = req.body.password || '';
    // Aciona a função de validação, passando como parãmetro a senha capturada e armazenando o resultado
    const isValid = isValidPassword(password);
    // Retorna o resultado para o usuário através do atributo 'is_valid' dentro de um JSON
    res.json({ is_valid: isValid });
});

// Define a porta de acesso da API
const PORT = process.env.PORT || 3000;
// Inicia a observação da porta, disponibilizando a API
app.listen(PORT, () => {
    console.log(`O servidor está rodando na porta ${PORT}`);
});
```
