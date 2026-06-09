// routes/clientes.js
const express = require('express');
const router = express.Router();
const supabase = require('./supabase'); 
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'b7store_secret_key_2024'

// =============================================================
// 📝 CADASTRO DE CLIENTE (público)
// =============================================================
router.post('/register', async (req, res, next) => {
    try {
        const { nome, email, senha, telefone, endereco, cidade, estado, cep } = req.body;
        
        if (!nome || !email || !senha) {
            return res.status(400).json({ 
                sucesso: false, 
                mensagem: "Nome, e-mail e senha são obrigatórios!" 
            });
        }
        
        // Verificar se email já existe
        const { data: existe } = await supabase
            .from('clientes')
            .select('email')
            .eq('email', email)
            .maybeSingle();
        
        if (existe) {
            return res.status(400).json({ 
                sucesso: false, 
                mensagem: "Este e-mail já está cadastrado!" 
            });
        }
        
        // Criptografar senha
        const senhaCriptografada = await bcrypt.hash(senha, 10);
        
        // Inserir cliente
        const { data, error } = await supabase
            .from('clientes')
            .insert([{
                nome,
                email,
                senha: senhaCriptografada,
                telefone: telefone || null,
                endereco: endereco || null,
                cidade: cidade || null,
                estado: estado || null,
                cep: cep || null
            }])
            .select();
        
        if (error) {
            console.error('Erro no insert:', error);
            throw error;
        }
        
        // Gerar token
        const token = jwt.sign(
            { id: data[0].id, email: data[0].email, tipo: 'cliente' },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        res.status(201).json({
            sucesso: true,
            mensagem: "Cadastro realizado com sucesso!",
            token,
            cliente: {
                id: data[0].id,
                nome: data[0].nome,
                email: data[0].email
            }
        });
    } catch (err) {
        console.error('Erro no cadastro:', err);
        next(err);
    }
});

// =============================================================
// 🔐 LOGIN DE CLIENTE (público)
// =============================================================
router.post('/login', async (req, res, next) => {
    try {
        const { email, senha } = req.body;
        
        if (!email || !senha) {
            return res.status(400).json({ 
                sucesso: false, 
                mensagem: "E-mail e senha são obrigatórios!" 
            });
        }
        
        const { data: cliente, error } = await supabase
            .from('clientes')
            .select('*')
            .eq('email', email)
            .maybeSingle();
        
        if (error || !cliente) {
            return res.status(401).json({ 
                sucesso: false, 
                mensagem: "E-mail ou senha inválidos!" 
            });
        }
        
        const senhaValida = await bcrypt.compare(senha, cliente.senha);
        
        if (!senhaValida) {
            return res.status(401).json({ 
                sucesso: false, 
                mensagem: "E-mail ou senha inválidos!" 
            });
        }
        
        const token = jwt.sign(
            { id: cliente.id, email: cliente.email, tipo: 'cliente' },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        res.json({
            sucesso: true,
            mensagem: "Login realizado com sucesso!",
            token,
            cliente: {
                id: cliente.id,
                nome: cliente.nome,
                email: cliente.email
            }
        });
    } catch (err) {
        console.error('Erro no login:', err);
        next(err);
    }
});

// =============================================================
// 🛒 ADICIONAR AO CARRINHO
// =============================================================
router.post('/carrinho', async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ sucesso: false, mensagem: "Faça login primeiro!" });
        }
        
        const decoded = jwt.verify(token, JWT_SECRET);
        const { produto_id, quantidade } = req.body;
        
        // Buscar produto
        const { data: produto, error: prodError } = await supabase
            .from('produtos')
            .select('*')
            .eq('id', produto_id)
            .single();
        
        if (prodError || !produto) {
            return res.status(404).json({ sucesso: false, mensagem: "Produto não encontrado!" });
        }
        
        // Verificar se já existe no carrinho
        const { data: existente } = await supabase
            .from('carrinho')
            .select('*')
            .eq('cliente_id', decoded.id)
            .eq('produto_id', produto_id)
            .maybeSingle();
        
        if (existente) {
            // Atualizar quantidade
            const { error: updateError } = await supabase
                .from('carrinho')
                .update({ quantidade: existente.quantidade + (quantidade || 1) })
                .eq('id', existente.id);
            
            if (updateError) throw updateError;
        } else {
            // Inserir novo item
            const { error: insertError } = await supabase
                .from('carrinho')
                .insert([{
                    cliente_id: decoded.id,
                    produto_id: produto_id,
                    quantidade: quantidade || 1,
                    preco_unitario: produto.preco
                }]);
            
            if (insertError) throw insertError;
        }
        
        res.json({
            sucesso: true,
            mensagem: "Produto adicionado ao carrinho!"
        });
    } catch (err) {
        console.error('Erro ao adicionar ao carrinho:', err);
        next(err);
    }
});

// =============================================================
// 🛒 VER CARRINHO
// =============================================================
router.get('/carrinho', async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ sucesso: false, mensagem: "Faça login primeiro!" });
        }
        
        const decoded = jwt.verify(token, JWT_SECRET);
        
        const { data: itens, error } = await supabase
            .from('carrinho')
            .select(`
                *,
                produtos (
                    id, 
                    nome, 
                    preco, 
                    imagem_url
                )
            `)
            .eq('cliente_id', decoded.id);
        
        if (error) throw error;
        
        const total = itens.reduce((sum, item) => sum + (item.preco_unitario * item.quantidade), 0);
        const quantidadeTotal = itens.reduce((sum, item) => sum + item.quantidade, 0);
        
        res.json({
            sucesso: true,
            itens,
            total,
            quantidadeTotal
        });
    } catch (err) {
        console.error('Erro ao buscar carrinho:', err);
        next(err);
    }
});

// =============================================================
// 🔄 ATUALIZAR QUANTIDADE DO ITEM NO CARRINHO
// =============================================================
router.put('/carrinho/:item_id', async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ sucesso: false, mensagem: "Faça login primeiro!" });
        }
        
        const decoded = jwt.verify(token, JWT_SECRET);
        const { quantidade } = req.body;
        
        if (!quantidade || quantidade < 1) {
            return res.status(400).json({ sucesso: false, mensagem: "Quantidade inválida!" });
        }
        
        const { error } = await supabase
            .from('carrinho')
            .update({ quantidade: quantidade })
            .eq('id', req.params.item_id)
            .eq('cliente_id', decoded.id);
        
        if (error) throw error;
        
        res.json({
            sucesso: true,
            mensagem: "Quantidade atualizada!"
        });
    } catch (err) {
        console.error('Erro ao atualizar quantidade:', err);
        next(err);
    }
});

// =============================================================
// 🗑️ REMOVER ITEM DO CARRINHO
// =============================================================
router.delete('/carrinho/:item_id', async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ sucesso: false, mensagem: "Faça login primeiro!" });
        }
        
        const decoded = jwt.verify(token, JWT_SECRET);
        
        const { error } = await supabase
            .from('carrinho')
            .delete()
            .eq('id', req.params.item_id)
            .eq('cliente_id', decoded.id);
        
        if (error) throw error;
        
        res.json({
            sucesso: true,
            mensagem: "Item removido do carrinho!"
        });
    } catch (err) {
        console.error('Erro ao remover item:', err);
        next(err);
    }
});

// =============================================================
// 🗑️ LIMPAR CARRINHO COMPLETO
// =============================================================
router.delete('/carrinho', async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ sucesso: false, mensagem: "Faça login primeiro!" });
        }
        
        const decoded = jwt.verify(token, JWT_SECRET);
        
        const { error } = await supabase
            .from('carrinho')
            .delete()
            .eq('cliente_id', decoded.id);
        
        if (error) throw error;
        
        res.json({
            sucesso: true,
            mensagem: "Carrinho esvaziado!"
        });
    } catch (err) {
        console.error('Erro ao limpar carrinho:', err);
        next(err);
    }
});

// =============================================================
// 💳 FINALIZAR PEDIDO
// =============================================================
router.post('/finalizar', async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ sucesso: false, mensagem: "Faça login primeiro!" });
        }
        
        const decoded = jwt.verify(token, JWT_SECRET);
        const { endereco_entrega, forma_pagamento } = req.body;
        
        if (!endereco_entrega || !forma_pagamento) {
            return res.status(400).json({ 
                sucesso: false, 
                mensagem: "Informe o endereço de entrega e forma de pagamento!" 
            });
        }
        
        // Buscar carrinho
        const { data: carrinho, error: carError } = await supabase
            .from('carrinho')
            .select(`
                *,
                produtos (
                    id, 
                    nome, 
                    preco
                )
            `)
            .eq('cliente_id', decoded.id);
        
        if (carError || !carrinho.length) {
            return res.status(400).json({ 
                sucesso: false, 
                mensagem: "Seu carrinho está vazio!" 
            });
        }
        
        // Calcular total
        let total = carrinho.reduce((sum, item) => sum + (item.preco_unitario * item.quantidade), 0);
        
        // Aplicar desconto para PIX
        let desconto = 0;
        if (forma_pagamento === 'pix') {
            desconto = total * 0.1;
            total = total - desconto;
        }
        
        // Gerar número do pedido
        const numero_pedido = `B7${Date.now()}${Math.floor(Math.random() * 1000)}`;
        
        // Criar pedido
        const { data: pedido, error: pedError } = await supabase
            .from('pedidos')
            .insert([{
                cliente_id: decoded.id,
                numero_pedido,
                total,
                endereco_entrega,
                forma_pagamento,
                status: 'confirmado'
            }])
            .select();
        
        if (pedError) throw pedError;
        
        // Criar itens do pedido
        for (const item of carrinho) {
            const { error: itemError } = await supabase
                .from('pedido_itens')
                .insert([{
                    pedido_id: pedido[0].id,
                    produto_id: item.produto_id,
                    quantidade: item.quantidade,
                    preco_unitario: item.preco_unitario,
                    subtotal: item.preco_unitario * item.quantidade
                }]);
            
            if (itemError) throw itemError;
        }
        
        // Limpar carrinho
        const { error: clearError } = await supabase
            .from('carrinho')
            .delete()
            .eq('cliente_id', decoded.id);
        
        if (clearError) throw clearError;
        
        res.json({
            sucesso: true,
            mensagem: "Pedido finalizado com sucesso!",
            pedido: {
                numero: numero_pedido,
                total,
                desconto,
                status: 'confirmado'
            }
        });
    } catch (err) {
        console.error('Erro ao finalizar pedido:', err);
        next(err);
    }
});

// =============================================================
// 📦 VER PEDIDOS DO CLIENTE
// =============================================================
router.get('/pedidos', async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ sucesso: false, mensagem: "Faça login primeiro!" });
        }
        
        const decoded = jwt.verify(token, JWT_SECRET);
        
        const { data: pedidos, error } = await supabase
            .from('pedidos')
            .select(`
                *,
                pedido_itens (
                    *,
                    produtos (
                        id,
                        nome,
                        imagem_url
                    )
                )
            `)
            .eq('cliente_id', decoded.id)
            .order('criado_em', { ascending: false });
        
        if (error) throw error;
        
        res.json({
            sucesso: true,
            pedidos
        });
    } catch (err) {
        console.error('Erro ao buscar pedidos:', err);
        next(err);
    }
});

// =============================================================
// 🔍 VER DETALHE DE UM PEDIDO ESPECÍFICO
// =============================================================
router.get('/pedidos/:pedido_id', async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ sucesso: false, mensagem: "Faça login primeiro!" });
        }
        
        const decoded = jwt.verify(token, JWT_SECRET);
        
        const { data: pedido, error } = await supabase
            .from('pedidos')
            .select(`
                *,
                pedido_itens (
                    *,
                    produtos (
                        id,
                        nome,
                        imagem_url,
                        preco
                    )
                )
            `)
            .eq('id', req.params.pedido_id)
            .eq('cliente_id', decoded.id)
            .single();
        
        if (error || !pedido) {
            return res.status(404).json({ 
                sucesso: false, 
                mensagem: "Pedido não encontrado!" 
            });
        }
        
        res.json({
            sucesso: true,
            pedido
        });
    } catch (err) {
        console.error('Erro ao buscar pedido:', err);
        next(err);
    }
});

module.exports = router;
