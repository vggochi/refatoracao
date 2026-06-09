const loggerMiddleware = (req, res, next) => {

    // Pegamos a hora atual e formatamos como string legível (ex: "10:30:45")
    const horaAtual = new Date().toLocaleTimeString('pt-BR');

    // Mostramos no terminal:
    //   - O método HTTP (GET, POST, PUT, DELETE)
    //   - A URL da rota acessada (ex: /api/produtos)
    // Template string com ${} para inserir as variáveis na mensagem
    console.log(`[${horaAtual}] 📋 Requisição recebida: ${req.method} ${req.url}`);

    // ⚠️ MUITO IMPORTANTE: next() é obrigatório!
    // Sem chamar next(), a requisição fica presa aqui e o app trava.
    // É next() que faz a requisição continuar o caminho até a rota certa.
    next();
};

// ─── Exportação ───────────────────────────────────────────────
// Exportamos a função para que o server.js possa importar e usar.
export default loggerMiddleware;