import { describe, expect, it } from 'vitest';
import { carregarPagina } from './helpers.js';

const portfolio = {
    nome: 'Ana Costa',
    profissao: 'Desenvolvedora',
    bio: 'Olá!',
    email: 'ana@exemplo.com',
    link: 'https://github.com/ana',
    projetos: [{ nome: 'Folio', descricao: 'Portfólios', link: 'https://folio.app' }],
    habilidades: ['HTML', 'CSS']
};

describe('Página Visualizar', () => {
    it('exibe os dados salvos no navegador', () => {
        const { document } = carregarPagina('visualizar.html', 'visualizar.js', { portfolio });

        expect(document.querySelector('.profile h1').textContent).toBe('Ana Costa');
        expect(document.querySelector('.avatar').textContent).toBe('AC');
        expect(document.querySelectorAll('.projects-grid .project-card')).toHaveLength(1);
        expect([...document.querySelectorAll('.skills span')].map(s => s.textContent)).toEqual(['HTML', 'CSS']);
    });

    it('mostra mensagens quando não há projetos nem habilidades', () => {
        const { document } = carregarPagina('visualizar.html', 'visualizar.js');

        expect(document.querySelector('.profile h1').textContent).toBe('Seu nome');
        expect(document.querySelector('.projects-grid').textContent).toContain('Nenhum projeto');
        expect(document.querySelector('.skills').textContent).toContain('Nenhuma habilidade');
    });

    it('mostra o portfólio de exemplo com ?exemplo=true', () => {
        const { document } = carregarPagina('visualizar.html', 'visualizar.js', { portfolio, query: '?exemplo=true' });
        expect(document.querySelector('.profile h1').textContent).toBe('Ana Costa');
        expect(document.querySelector('.preview-header .section-label').textContent).toBe('PORTFÓLIO DE EXEMPLO');
    });

    it('codifica e decodifica os dados do link compartilhado', () => {
        const { window } = carregarPagina('visualizar.html', 'visualizar.js');
        const codigo = window.codificarDados(portfolio);

        expect(codigo).not.toMatch(/[+/=]/); // seguro para URL
        expect(window.decodificarDados(codigo)).toEqual(portfolio);
        expect(window.decodificarDados('lixo!!')).toBeNull();
    });

    it('abre um portfólio compartilhado em modo somente leitura', () => {
        const { window } = carregarPagina('visualizar.html', 'visualizar.js');
        const codigo = window.codificarDados({ nome: 'Bruno Lima' });

        const { document } = carregarPagina('visualizar.html', 'visualizar.js', { query: `?dados=${codigo}` });
        expect(document.querySelector('.profile h1').textContent).toBe('Bruno Lima');
        expect(document.querySelector('.preview-header .section-label').textContent).toBe('PORTFÓLIO COMPARTILHADO');
    });

    it('não exibe links com protocolo inseguro', () => {
        const { document } = carregarPagina('visualizar.html', 'visualizar.js', {
            portfolio: { nome: 'X', link: 'javascript:alert(1)' }
        });
        expect([...document.querySelectorAll('.profile a')].some(a => a.href.startsWith('javascript:'))).toBe(false);
    });
});
