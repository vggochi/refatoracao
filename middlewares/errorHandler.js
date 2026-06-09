const errorHandlerMiddleware = (err, req, res, next) => {

    // Loga o erro no terminal do servidor para o DESENVOLVEDOR ver.
    // Isso não aparece para o usuário final, só no VS Code!
    console.error(`❌ Erro detectado: ${err.message}`);

    // Retorna uma resposta JSON com:
    //   - Status HTTP 500 (Internal Server Error — erro interno do servidor)
    //   - Um objeto JSON com informações do erro
    res.status(500).json({
        sucesso: false,
        mensagem: "Ops! Ocorreu um erro interno no servidor.",

        // ⚠️ ATENÇÃO: Em uma aplicação REAL, nunca exponha detalhes do erro
        // para o usuário (pode revelar informações sensíveis do servidor).
        // Aqui mandamos o detalhe apenas para fins DIDÁTICOS, para ver na tela!
        detalhe: err.message
    });
};

// ─── Exportação ───────────────────────────────────────────────
export default errorHandlerMiddleware;