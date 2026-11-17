import { describe, expect, it } from 'vitest';
import { carregarPagina, digitar } from './helpers.js';

describe('Página Sobre você', () => {
    it('preenche o formulário com os dados salvos', () => {
        const { document } = carregarPagina('sobre-voce.html', 'sobre-voce.js', {
            portfolio: { nome: 'Ana Costa', email: 'ana@exemplo.com', profissao: 42 }
        });
        expect(document.getElementById('nome').value).toBe('Ana Costa');
        expect(document.getElementById('email').value).toBe('ana@exemplo.com');
        expect(document.getElementById('profissao').value).toBe('');
    });

    it('salva automaticamente ao digitar, sem espaços extras', () => {
        const { window, document, lerPortfolio } = carregarPagina('sobre-voce.html', 'sobre-voce.js', {
            portfolio: { habilidades: ['Git'] }
        });
        digitar(window, document.getElementById('nome'), '  Ana Costa  ');

        const salvo = lerPortfolio();
        expect(salvo.nome).toBe('Ana Costa');
        expect(salvo.habilidades).toEqual(['Git']);
    });
});
