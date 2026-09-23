// ================================
// VISUALIZAR PORTFÓLIO
// ================================


// Detecta se a página está no modo exemplo
const params = new URLSearchParams(window.location.search);

const modoExemplo = params.get("exemplo") === "true";


// Dados de exemplo
const dadosExemplo = {

    nome: "Ana Costa",

    profissao: "Estudante de Sistemas de Informação",

    bio: "Olá! Sou estudante de tecnologia e gosto de transformar ideias em experiências simples e úteis.",

    projetos: [
        {
            titulo: "Organizador de estudos",
            descricao: "Uma página para organizar disciplinas, acompanhar tarefas e planejar a semana."
        },
        {
            titulo: "Biblioteca da turma",
            descricao: "Catálogo de livros desenvolvido em equipe para praticar HTML, CSS e JavaScript."
        }
    ],

    habilidades: [
        "HTML",
        "CSS",
        "JavaScript",
        "Git"
    ]

};


// Futuramente:
// - carregar portfolio do localStorage
// - renderizar os dados
// - tratar campos vazios
// - tratar ausência de projetos
// - tratar ausência de habilidades
// - diferenciar modo exemplo e modo real


console.log("Página de visualização carregada.");

console.log("Modo exemplo:", modoExemplo);