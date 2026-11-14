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

// Dados vindos de um link compartilhado têm prioridade sobre o localStorage.
const dadosCompartilhados = decodificarDados(params.get('dados'));
const modoCompartilhado = Boolean(dadosCompartilhados);

if (modoCompartilhado) document.querySelector('.preview-header .button').hidden = true;

const dados = dadosCompartilhados || (modoExemplo ? dadosExemplo : portfolio);
const texto = value => typeof value === 'string' ? value : '';

document.querySelector('.profile h1').textContent = texto(dados.nome) || 'Seu nome';
document.querySelector('.profession').textContent = texto(dados.profissao);
document.querySelector('.bio').textContent = texto(dados.bio);
document.querySelector('.avatar').textContent = texto(dados.nome).trim().split(/\s+/).slice(0, 2).map(part => part[0] || '').join('').toUpperCase() || 'VO';
document.querySelector('.preview-header .section-label').textContent = modoCompartilhado ? 'PORTFÓLIO COMPARTILHADO' : modoExemplo ? 'PORTFÓLIO DE EXEMPLO' : 'PRÉVIA DO SEU PORTFÓLIO';
document.querySelector('.footer span:last-child').textContent = modoCompartilhado ? 'Portfólio compartilhado · somente leitura' : modoExemplo ? 'Dados de exemplo' : 'Dados salvos neste navegador';

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


// ================================
// EXPORTAÇÃO: LINK, PDF E PNG
// ================================

const botaoExportarLink = document.getElementById('exportar-link');
const botaoExportarPdf = document.getElementById('exportar-pdf');
const botaoExportarPng = document.getElementById('exportar-png');
const mensagemExportacao = document.getElementById('mensagem-exportacao');

// Converte os dados do portfólio em texto compacto para caber no link.
function codificarDados(dados) {
    const bytes = new TextEncoder().encode(JSON.stringify(dados));
    let binario = '';
    bytes.forEach(byte => {
        binario += String.fromCharCode(byte);
    });
    return btoa(binario).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Lê os dados enviados pelo link compartilhado.
function decodificarDados(valor) {
    if (typeof valor !== 'string' || !valor) return null;
    try {
        const base64 = valor.replace(/-/g, '+').replace(/_/g, '/');
        const binario = atob(base64 + '='.repeat((4 - base64.length % 4) % 4));
        const bytes = Uint8Array.from(binario, caractere => caractere.charCodeAt(0));
        const dados = JSON.parse(new TextDecoder().decode(bytes));
        return dados && typeof dados === 'object' && !Array.isArray(dados) ? dados : null;
    } catch {
        return null;
    }
}

function mostrarMensagem(texto) {
    mensagemExportacao.textContent = texto;
}

function definirOcupado(botao, ocupado) {
    if (!botao.dataset.rotulo) botao.dataset.rotulo = botao.textContent.trim();
    botao.disabled = ocupado;
    botao.textContent = ocupado ? 'Aguarde...' : botao.dataset.rotulo;
}

// Gera o nome do arquivo a partir do nome do usuário.
function nomeArquivo() {
    const nome = texto(dados.nome).trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    return 'portfolio' + (nome ? '-' + nome : '');
}

async function copiarTexto(valor) {
    if (navigator.clipboard && window.isSecureContext) {
        try {
            await navigator.clipboard.writeText(valor);
            return true;
        } catch {
            // Sem permissão da API: segue para o fallback.
        }
    }
    // Fallback para contextos sem a API de área de transferência.
    const area = document.createElement('textarea');
    area.value = valor;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const copiado = document.execCommand('copy');
    area.remove();
    if (!copiado) throw new Error('Falha ao copiar');
    return true;
}

// Copia um link que contém os dados do portfólio e abre em qualquer navegador.
botaoExportarLink.addEventListener('click', async () => {
    try {
        definirOcupado(botaoExportarLink, true);
        const url = new URL(window.location.href);
        url.searchParams.delete('exemplo');
        url.searchParams.set('dados', codificarDados(dados));
        if (url.href.length > 6000) {
            mostrarMensagem('O portfólio é grande demais para um link. Use PDF ou PNG.');
            return;
        }
        await copiarTexto(url.href);
        mostrarMensagem('Link copiado! Cole em qualquer navegador para compartilhar seu portfólio.');
    } catch {
        mostrarMensagem('Não foi possível copiar o link. Tente novamente.');
    } finally {
        definirOcupado(botaoExportarLink, false);
    }
});

// Abre a janela de impressão, onde o portfólio pode ser salvo como PDF.
botaoExportarPdf.addEventListener('click', () => {
    mostrarMensagem('Na janela de impressão, escolha "Salvar como PDF".');
    const tituloAnterior = document.title;
    document.title = nomeArquivo();
    window.print();
    document.title = tituloAnterior;
});

// Baixa o cartão do portfólio como imagem PNG.
botaoExportarPng.addEventListener('click', async () => {
    if (typeof html2canvas !== 'function') {
        mostrarMensagem('Não foi possível carregar a biblioteca de imagem. Verifique sua conexão e recarregue a página.');
        return;
    }
    try {
        definirOcupado(botaoExportarPng, true);
        mostrarMensagem('Gerando imagem...');
        const tela = await html2canvas(document.querySelector('.portfolio-card'), {
            scale: 2,
            backgroundColor: '#ffffff'
        });
        const link = document.createElement('a');
        link.download = nomeArquivo() + '.png';
        link.href = tela.toDataURL('image/png');
        link.click();
        mostrarMensagem('Imagem baixada!');
    } catch {
        mostrarMensagem('Não foi possível gerar a imagem. Tente novamente.');
    } finally {
        definirOcupado(botaoExportarPng, false);
    }
});