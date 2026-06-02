// =============================================================
// server.js — Servidor Principal da API do Haruy Sushi
// =============================================================
// Aula 6: API Middleware and Error Handling
//
// O que aprendemos nesta aula?
//   1. O que são Middlewares e para que servem
//   2. Criar um Middleware de Log (logger.js)
//   3. Criar um Middleware de Tratamento de Erros (errorHandler.js)
//   4. Tratar rotas não encontradas (Erro 404)
//   5. A ORDEM dos middlewares importa muito!
//
// Fluxo de uma Requisição (com Middlewares):
//
//  App Mobile
//     │
//     ▼
//  [cors()]              ← Middleware 1: Libera acesso de outras origens
//     │
//     ▼
//  [express.json()]      ← Middleware 2: Transforma o body em JSON
//     │
//     ▼
//  [logger]              ← Middleware 3: Anota a requisição no terminal
//     │
//     ▼
//  Rota correta          ← A requisição chega na rota certa
//  (ex: GET /api/produtos)
//     │
//     ▼ (se der erro)
//  [errorHandler]        ← Captura qualquer erro das rotas
//     │
//     ▼
//  Resposta enviada ao App Mobile
//
// =============================================================


// ─── 1. Importações das Dependências ─────────────────────────
// express: framework web para criar o servidor e as rotas
const express = require('express');
const cors = require('cors');
const logger = require('./middlewares/logger');
const errorHandler = require('./middlewares/errorHandler');
const app = express();

app.use(cors());
app.use(express.json());
app.use(logger);
app.get('/', (req, res) => {
    res.json({ mensagem: '🍣 Bem-vindo à API do Haruy Sushi! (Aula 6)' });
});

const rotasCategorias = require('./routes/categorias');
const rotasProdutos = require('./routes/produtos');

app.use('/api/categorias', rotasCategorias);
app.use('/api/produtos', rotasProdutos);

app.use((req, res, next) => {
    res.status(404).json({
        sucesso: false,
        mensagem: `Rota '${req.url}' não encontrada na API do Haruy Sushi.`
    });
});

app.use(errorHandler);
const PORTA = process.env.PORT || 3000;


app.listen(PORTA, () => {
    console.log('');
    console.log('🚀 ================================');
    console.log(`🚀 Servidor rodando!`);
    console.log(`🚀 Portal local: ${PORTA}`);
    console.log('🚀 ================================');
    console.log('');
    console.log('📋 Rotas disponíveis:');
    console.log(`   GET    /api/categorias`);
    console.log(`   POST   /api/categorias`);
    console.log(`   GET    /api/produtos`);
    console.log(`   GET    /api/produtos/:id`);
    console.log(`   POST   /api/produtos`);
    console.log(`   PUT    /api/produtos/:id`);
    console.log(`   DELETE /api/produtos/:id`);
    console.log('');
    console.log('💣 Rota de teste de erro:');
    console.log(`   GET   /api/produtos/erro-teste`);
    console.log('');
});

module.exports = app;