// =============================================================
// server.js — Servidor Principal da API do B7Store
// =============================================================

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const logger = require('./logger');
const errorHandler = require('./errorHandler');
const supabase = require('./supabase');

// Importação das rotas (todos na raiz)
const rotasProdutos = require('./produtos');
const rotasClientes = require('./clientes'); // ← clientes na raiz

const app = express();

// Middlewares globais
app.use(cors());
app.use(express.json());
app.use(logger);

// =============================================================
// ROTAS PÚBLICAS
// =============================================================

// Rota raiz
app.get('/', (req, res) => {
    res.json({ 
        sucesso: true,
        mensagem: '🛍️ Bem-vindo à API Oficial da Loja B7Store!' 
    });
});

app.get('/api', (req, res) => {
    res.json({ 
        sucesso: true,
        mensagem: '📦 API da B7Store está funcionando perfeitamente!' 
    });
});

// =============================================================
// ROTA DE LOGIN DO ADMIN (usa Supabase Auth)
// =============================================================
app.post('/api/auth/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ 
                sucesso: false, 
                mensagem: "E-mail e senha são obrigatórios." 
            });
        }

        const { data, error } = await supabase.auth.signInWithPassword({ 
            email, 
            password 
        });
        
        if (error) {
            return res.status(401).json({ 
                sucesso: false, 
                mensagem: "E-mail ou senha inválidos." 
            });
        }

        return res.status(200).json({ 
            sucesso: true,
            mensagem: "Login efetuado com sucesso!", 
            token: data.session.access_token 
        });
    } catch (err) {
        next(err);
    }
});

// =============================================================
// ROTAS PROTEGIDAS DO ADMIN (cadastro de produtos)
// =============================================================
app.post('/api/produtos', async (req, res, next) => {
    try {
        const { nome, preco, imagem_url, info } = req.body;
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return res.status(401).json({ 
                sucesso: false, 
                mensagem: "Token de autenticação não encontrado." 
            });
        }
        
        const token = authHeader.split(' ')[1];

        // Valida se o Token pertence a uma sessão ativa no Supabase
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        
        if (authError || !user) {
            return res.status(401).json({ 
                sucesso: false, 
                mensagem: "Sessão inválida ou expirada. Faça login novamente." 
            });
        }

        if (!nome || !preco) {
            return res.status(400).json({ 
                sucesso: false, 
                mensagem: "Nome e preço são obrigatórios." 
            });
        }

        const { data, error } = await supabase
            .from('produtos')
            .insert([{ 
                nome, 
                preco: parseFloat(preco), 
                imagem_url: imagem_url || null, 
                info: info || null 
            }])
            .select();

        if (error) throw new Error(error.message);
        
        return res.status(201).json({ 
            sucesso: true, 
            mensagem: "Produto cadastrado com sucesso!",
            produto: data[0]
        });
    } catch (err) {
        next(err);
    }
});

// =============================================================
// ROTAS DE CLIENTES (carrinho, etc)
// =============================================================
app.use('/api/produtos', rotasProdutos);
app.use('/api/clientes', rotasClientes);

// =============================================================
// TRATAMENTO DE ERROS
// =============================================================

// Tratamento de rota não encontrada
app.use((req, res, next) => {
    res.status(404).json({
        sucesso: false,
        mensagem: `⚠️ A rota '${req.url}' não existe na nossa API.`
    });
});

// Middleware de erros global
app.use(errorHandler);

// =============================================================
// INICIALIZAÇÃO
// =============================================================
const PORTA = process.env.PORT || 3000;

app.listen(PORTA, () => {
    console.log('');
    console.log(' ==========================================');
    console.log(` 🛍️  Servidor da B7Store rodando com sucesso!`);
    console.log(` Acesso Local: http://localhost:${PORTA}`);
    console.log(' ==========================================');
    console.log('');
    console.log('📋 Rotas da API:');
    console.log(`   POST   /api/auth/login         → Login do ADMIN`);
    console.log(`   POST   /api/produtos           → Cadastrar produto (ADMIN)`);
    console.log(`   GET    /api/produtos           → Listar produtos (PÚBLICO)`);
    console.log(`   GET    /api/produtos/:id       → Detalhe do produto`);
    console.log(`   POST   /api/clientes/register  → Cadastro de cliente`);
    console.log(`   POST   /api/clientes/login     → Login de cliente`);
    console.log(`   GET    /api/clientes/carrinho  → Ver carrinho`);
    console.log(`   POST   /api/clientes/carrinho  → Adicionar ao carrinho`);
    console.log(`   DELETE /api/clientes/carrinho/:id → Remover do carrinho`);
    console.log(`   POST   /api/clientes/finalizar → Finalizar compra`);
    console.log('');
});

module.exports = app;
