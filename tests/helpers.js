import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { JSDOM, VirtualConsole } from 'jsdom';

const ROOT = join(import.meta.dirname, '..');

/**
 * Carrega uma página real do projeto em um navegador simulado (jsdom)
 * e executa o script dela, como aconteceria no navegador.
 *
 * @param {string} pagina  arquivo em paginas/ (ex.: 'habilidades.html')
 * @param {string} script  arquivo em js/ (ex.: 'habilidades.js')
 * @param {object} [opcoes]
 * @param {object|string} [opcoes.portfolio] valor inicial de localStorage['portfolio']
 * @param {string} [opcoes.query] query string da URL (ex.: '?exemplo=true')
 */
export function carregarPagina(pagina, script, { portfolio, query = '' } = {}) {
    const html = readFileSync(join(ROOT, 'paginas', pagina), 'utf-8');
    const codigo = readFileSync(join(ROOT, 'js', script), 'utf-8');

    // Silencia avisos do jsdom (ex.: navegação não implementada)
    const virtualConsole = new VirtualConsole();

    const dom = new JSDOM(html, {
        url: `https://folio.test/paginas/${pagina}${query}`,
        runScripts: 'outside-only',
        virtualConsole
    });
    const { window } = dom;

    if (portfolio !== undefined) {
        const valor = typeof portfolio === 'string' ? portfolio : JSON.stringify(portfolio);
        window.localStorage.setItem('portfolio', valor);
    }

    window.console.log = () => {};
    window.console.error = () => {};
    window.eval(codigo);
    window.document.dispatchEvent(new window.Event('DOMContentLoaded'));

    const lerPortfolio = () => JSON.parse(window.localStorage.getItem('portfolio'));

    return { window, document: window.document, lerPortfolio };
}

/** Simula o usuário digitando em um campo. */
export function digitar(window, elemento, valor) {
    elemento.value = valor;
    elemento.dispatchEvent(new window.Event('input', { bubbles: true }));
}
