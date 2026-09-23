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
// Preenche a prévia com os dados salvos, sem alterar o portfólio no modo exemplo.
let portfolio;
try {
    portfolio = JSON.parse(localStorage.getItem('portfolio')) || {};
} catch {
    portfolio = {};
}
if (typeof portfolio !== 'object' || Array.isArray(portfolio)) portfolio = {};
const dados = modoExemplo ? dadosExemplo : portfolio;
const texto = value => typeof value === 'string' ? value : '';

document.querySelector('.profile h1').textContent = texto(dados.nome) || 'Seu nome';
document.querySelector('.profession').textContent = texto(dados.profissao);
document.querySelector('.bio').textContent = texto(dados.bio);
document.querySelector('.avatar').textContent = texto(dados.nome).trim().split(/\s+/).slice(0, 2).map(part => part[0] || '').join('').toUpperCase() || 'VO';
document.querySelector('.preview-header .section-label').textContent = modoExemplo ? 'PORTFÓLIO DE EXEMPLO' : 'PRÉVIA DO SEU PORTFÓLIO';
document.querySelector('.footer span:last-child').textContent = modoExemplo ? 'Dados de exemplo' : 'Dados salvos neste navegador';

const contato = document.querySelector('.contact');
contato.hidden = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(texto(dados.email));
if (!contato.hidden) contato.href = 'mailto:' + encodeURIComponent(dados.email);

function adicionarLink(container, value, label) {
    try {
        const url = new URL(value);
        if (!['http:', 'https:'].includes(url.protocol)) return;
        const link = document.createElement('a');
        link.className = 'contact';
        link.href = url.href;
        link.textContent = label;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        container.appendChild(link);
    } catch {
        // Links vazios ou inválidos não são exibidos.
    }
}
adicionarLink(document.querySelector('.profile'), dados.link, 'Perfil profissional ↗');

const listaProjetos = document.querySelector('.projects-grid');
const modeloProjeto = listaProjetos.querySelector('.project-card').cloneNode(true);
listaProjetos.replaceChildren();
const projetos = Array.isArray(dados.projetos) ? dados.projetos.filter(item => item && typeof item === 'object') : [];
projetos.forEach((projeto, index) => {
    const card = modeloProjeto.cloneNode(true);
    card.querySelector('small').textContent = String(index + 1).padStart(2, '0');
    card.querySelector('h3').textContent = texto(projeto.nome || projeto.titulo);
    card.querySelector('p').textContent = texto(projeto.descricao);
    adicionarLink(card, projeto.link, 'Ver projeto ↗');
    listaProjetos.appendChild(card);
});
if (!projetos.length) listaProjetos.textContent = 'Nenhum projeto cadastrado ainda.';

const listaHabilidades = document.querySelector('.skills');
listaHabilidades.replaceChildren();
const habilidades = Array.isArray(dados.habilidades) ? dados.habilidades.filter(item => typeof item === 'string') : [];
habilidades.forEach(habilidade => {
    const tag = document.createElement('span');
    tag.textContent = habilidade;
    listaHabilidades.appendChild(tag);
});
if (!habilidades.length) listaHabilidades.textContent = 'Nenhuma habilidade cadastrada ainda.';