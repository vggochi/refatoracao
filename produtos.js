// =============================================================
// produtos.js — Rotas do Catálogo conectadas ao Supabase
// =============================================================
const express = require('express');
const router = express.Router();
const supabase = require('./supabase');

// 🔍 1. BUSCAR TODOS OS PRODUTOS
router.get('/', async (req, res, next) => {
    try {
        const { data, error } = await supabase
            .from('produtos')
            .select('*')
            .order('criado_em', { ascending: false });

        if (error) {
            throw error;
        }

        res.json(data);
    } catch (erro) {
        next(erro);
    }
});

// 🔍 2. BUSCAR PRODUTO POR ID (UUID)
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        
        console.log('Buscando produto com UUID:', id);
        
        // UUID é string, não converter para número!
        const { data, error } = await supabase
            .from('produtos')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) {
            console.error('Produto não encontrado:', error);
            return res.status(404).json({ 
                sucesso: false,
                mensagem: "Produto não encontrado na loja." 
            });
        }

        console.log('Produto encontrado:', data.nome);
        res.json(data);
    } catch (erro) {
        console.error('Erro no servidor:', erro);
        res.status(500).json({ 
            sucesso: false,
            mensagem: "Erro interno ao buscar produto." 
        });
    }
});

// 💾 3. CADASTRAR PRODUTO
router.post('/', async (req, res, next) => {
    try {
        const { nome, preco, imagem_url, info } = req.body;
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return res.status(401).json({ 
                sucesso: false, 
                mensagem: "Token não encontrado." 
            });
        }
        
        const token = authHeader.split(' ')[1];
        
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        
        if (authError || !user) {
            return res.status(401).json({ 
                sucesso: false, 
                mensagem: "Sessão inválida." 
            });
        }

        if (!nome || !preco) {
            return res.status(400).json({ 
                sucesso: false, 
                mensagem: "Nome e preço são obrigatórios!" 
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

        if (error) {
            console.error('Erro ao inserir:', error);
            throw error;
        }

        res.status(201).json({
            sucesso: true,
            mensagem: "✨ Produto cadastrado com sucesso!",
            produto: data[0]
        });
    } catch (erro) {
        console.error('Erro no cadastro:', erro);
        next(erro);
    }
});

// 📝 4. ATUALIZAR PRODUTO (com UUID)
router.put('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { nome, preco, imagem_url, info } = req.body;
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return res.status(401).json({ 
                sucesso: false, 
                mensagem: "Token não encontrado." 
            });
        }
        
        const token = authHeader.split(' ')[1];
        
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        
        if (authError || !user) {
            return res.status(401).json({ 
                sucesso: false, 
                mensagem: "Sessão inválida." 
            });
        }

        if (!nome || !preco) {
            return res.status(400).json({ 
                sucesso: false, 
                mensagem: "Nome e preço são obrigatórios!" 
            });
        }

        // UUID é string, não converter para número!
        const { data, error } = await supabase
            .from('produtos')
            .update({ 
                nome, 
                preco: parseFloat(preco), 
                imagem_url: imagem_url || null, 
                info: info || null 
            })
            .eq('id', id)
            .select();

        if (error) {
            console.error('Erro ao atualizar:', error);
            throw error;
        }

        if (!data || data.length === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem: "Produto não encontrado."
            });
        }

        res.json({
            sucesso: true,
            mensagem: "📝 Produto atualizado com sucesso!",
            produto: data[0]
        });
    } catch (erro) {
        console.error('Erro na atualização:', erro);
        next(erro);
    }
});

// ❌ 5. DELETAR PRODUTO (com UUID)
router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return res.status(401).json({ 
                sucesso: false, 
                mensagem: "Token não encontrado." 
            });
        }
        
        const token = authHeader.split(' ')[1];
        
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        
        if (authError || !user) {
            return res.status(401).json({ 
                sucesso: false, 
                mensagem: "Sessão inválida." 
            });
        }

        // UUID é string, não converter para número!
        const { error } = await supabase
            .from('produtos')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Erro ao deletar:', error);
            throw error;
        }

        res.json({ 
            sucesso: true, 
            mensagem: "🗑️ Produto removido com sucesso!" 
        });
    } catch (erro) {
        console.error('Erro na deleção:', erro);
        next(erro);
    }
});

module.exports = router;
