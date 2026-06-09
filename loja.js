// =============================================================
// routes/loja.js — Rotas de Produtos e Autenticação da B7Store
// =============================================================

const express = require('express');
const router = express.Router();
const supabase = require('./supabase'); // Importa o conector do banco de dados

// ─── ROTA 1: Buscar todos os produtos (Público para a Vitrine) ───────────
router.get('/produtos', async (req, res, next) => {
    try {
        const { data, error } = await supabase
            .from('produtos')
            .select('*')
            .order('criado_em', { ascending: false });

        if (error) throw new Error(error.message);
        return res.status(200).json(data);
    } catch (err) {
        next(err); // Envia o erro para o errorHandler global
    }
});

// ─── ROTA 2: Login do Administrador (Gera Token de Acesso) ───────────────
router.post('/auth/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ sucesso: false, error: "E-mail e senha são obrigatórios." });
        }

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return res.status(401).json({ sucesso: false, error: "Acesso negado: " + error.message });

        return res.status(200).json({ 
            sucesso: true,
            message: "Login efetuado com sucesso!", 
            token: data.session.access_token 
        });
    } catch (err) {
        next(err);
    }
});

// ─── ROTA 3: Cadastrar Novo Produto (Protegido por Token JWT) ────────────
router.post('/produtos', async (req, res, next) => {
    try {
        const { nome, preco, imagem_url, info } = req.body;
        const authHeader = req.headers.authorization;
        
        if (!authHeader) return res.status(401).json({ sucesso: false, error: "Não autorizado. Token faltando." });
        const token = authHeader.split(' ')[1];

        // Valida se o Token pertence a uma sessão ativa de admin no Supabase
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) return res.status(401).json({ sucesso: false, error: "Sessão inválida ou expirada." });

        if (!nome || !preco) {
            return res.status(400).json({ sucesso: false, error: "Nome e preço são obrigatórios." });
        }

        const { data, error } = await supabase
            .from('produtos')
            .insert([{ nome, preco: parseFloat(preco), imagem_url, info }]);

        if (error) throw new Error(error.message);
        return res.status(201).json({ sucesso: true, message: "Produto cadastrado com sucesso!" });
    } catch (err) {
        next(err);
    }
});

module.exports = router;