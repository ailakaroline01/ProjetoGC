import { describe, expect, it } from 'vitest';
import { carregarPagina } from './helpers.js';

function adicionar({ window, document }, valor) {
    document.getElementById('skillInput').value = valor;
    document.getElementById('btnAddSkill').dispatchEvent(new window.Event('click'));
}

const tags = document => [...document.querySelectorAll('.skill-tag')].map(tag => tag.firstChild.textContent);

describe('Página Habilidades', () => {
    it('mostra mensagem quando não há habilidades', () => {
        const { document } = carregarPagina('habilidades.html', 'habilidades.js');
        expect(document.querySelector('.empty-message').textContent).toContain('Nenhuma habilidade');
    });

    it('adiciona uma habilidade e salva no localStorage', () => {
        const pagina = carregarPagina('habilidades.html', 'habilidades.js');
        adicionar(pagina, '  Git  ');

        expect(tags(pagina.document)).toEqual(['Git']);
        expect(pagina.lerPortfolio().habilidades).toEqual(['Git']);
    });

    it('não aceita habilidade vazia', () => {
        const pagina = carregarPagina('habilidades.html', 'habilidades.js');
        adicionar(pagina, '   ');

        expect(pagina.document.getElementById('errorMsg').textContent).toBe('A habilidade não pode estar vazia.');
        expect(tags(pagina.document)).toEqual([]);
    });

    it('não aceita habilidade duplicada (ignorando maiúsculas)', () => {
        const pagina = carregarPagina('habilidades.html', 'habilidades.js', {
            portfolio: { habilidades: ['JavaScript'] }
        });
        adicionar(pagina, 'javascript');

        expect(pagina.document.getElementById('errorMsg').textContent).toContain('já foi adicionada');
        expect(pagina.lerPortfolio().habilidades).toEqual(['JavaScript']);
    });

    it('remove uma habilidade', () => {
        const pagina = carregarPagina('habilidades.html', 'habilidades.js', {
            portfolio: { habilidades: ['HTML', 'CSS'] }
        });
        pagina.document.querySelector('.skill-tag button').click();

        expect(tags(pagina.document)).toEqual(['CSS']);
        expect(pagina.lerPortfolio().habilidades).toEqual(['CSS']);
    });

    it('preserva os outros dados do portfólio ao salvar', () => {
        const pagina = carregarPagina('habilidades.html', 'habilidades.js', {
            portfolio: { nome: 'Ana', projetos: [{ nome: 'X', descricao: 'Y', link: '' }] }
        });
        adicionar(pagina, 'CSS');

        const salvo = pagina.lerPortfolio();
        expect(salvo.nome).toBe('Ana');
        expect(salvo.projetos).toHaveLength(1);
        expect(salvo.habilidades).toEqual(['CSS']);
    });

    it('não quebra com localStorage corrompido', () => {
        const pagina = carregarPagina('habilidades.html', 'habilidades.js', { portfolio: '{json inválido' });
        adicionar(pagina, 'Git');
        expect(pagina.lerPortfolio().habilidades).toEqual(['Git']);
    });
});
