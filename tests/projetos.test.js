import { describe, expect, it } from 'vitest';
import { carregarPagina, digitar } from './helpers.js';

describe('Página Projetos — validação', () => {
    const { window } = carregarPagina('projetos.html', 'projetos.js');

    it.each([
        ['', true],
        ['https://github.com/usuario', true],
        ['http://exemplo.com', true],
        ['exemplo.com', false],
        ['ftp://exemplo.com', false],
        ['javascript:alert(1)', false]
    ])('isValidLink(%j) → %s', (link, esperado) => {
        expect(window.isValidLink(link)).toBe(esperado);
    });

    it('exige nome e descrição', () => {
        const erros = window.getProjectErrors({ nome: ' ', descricao: '', link: '' });
        expect(erros.nome).toBe('Informe o nome do projeto.');
        expect(erros.descricao).toBe('Informe a descrição do projeto.');
        expect(erros.link).toBe('');
    });

    it('considera válido um projeto completo', () => {
        expect(window.projectIsValid({ nome: 'Folio', descricao: 'Portfólio', link: 'https://folio.app' })).toBe(true);
    });
});

describe('Página Projetos — interface e armazenamento', () => {
    it('mostra mensagem quando não há projetos', () => {
        const { document } = carregarPagina('projetos.html', 'projetos.js');
        expect(document.getElementById('empty-projects').hidden).toBe(false);
    });

    it('carrega projetos salvos e descarta dados inválidos', () => {
        const { document } = carregarPagina('projetos.html', 'projetos.js', {
            portfolio: { projetos: [{ nome: 'Folio', descricao: 'Site', link: 42 }, null, 'texto'] }
        });
        const itens = document.querySelectorAll('.project-item');
        expect(itens).toHaveLength(1);
        expect(itens[0].querySelector('.project-name').value).toBe('Folio');
        expect(itens[0].querySelector('.project-link').value).toBe('');
    });

    it('adiciona um projeto e salva apenas quando ele é válido', () => {
        const { window, document, lerPortfolio } = carregarPagina('projetos.html', 'projetos.js', {
            portfolio: { nome: 'Ana', habilidades: ['Git'] }
        });
        document.getElementById('add-project').click();
        const item = document.querySelector('.project-item');

        digitar(window, item.querySelector('.project-name'), 'Folio');
        expect(lerPortfolio().projetos).toBeUndefined(); // ainda sem descrição

        digitar(window, item.querySelector('.project-description'), 'Sistema de portfólios');
        const salvo = lerPortfolio();
        expect(salvo.projetos).toEqual([{ nome: 'Folio', descricao: 'Sistema de portfólios', link: '' }]);
        expect(salvo.nome).toBe('Ana');
        expect(salvo.habilidades).toEqual(['Git']);
    });

    it('remove um projeto', () => {
        const { document, lerPortfolio } = carregarPagina('projetos.html', 'projetos.js', {
            portfolio: { projetos: [{ nome: 'A', descricao: 'a', link: '' }, { nome: 'B', descricao: 'b', link: '' }] }
        });
        document.querySelector('.remove-project').click();
        expect(document.querySelectorAll('.project-item')).toHaveLength(1);
        expect(lerPortfolio().projetos.map(p => p.nome)).toEqual(['B']);
    });
});
