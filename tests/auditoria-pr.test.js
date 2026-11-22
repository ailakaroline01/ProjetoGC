// Testes das regras da auditoria automática de PR (.github/scripts/auditoria-pr.cjs)
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const regras = require('../.github/scripts/auditoria-pr.cjs');

// Normaliza CRLF (Windows) para LF, para os testes rodarem igual em qualquer sistema
const TEMPLATE = readFileSync(new URL('../.github/pull_request_template.md', import.meta.url), 'utf-8')
    .replace(/\r\n/g, '\n');

const prValido = {
    origem: 'feature/exportar-pdf',
    destino: 'develop',
    titulo: 'feat: exportar portfólio em PDF',
    corpo: TEMPLATE
        .replace('<!-- O que foi alterado e por quê? -->', 'Adiciona botão para exportar o portfólio em PDF.')
        .replace('\nCloses #\n', '\nCloses #15\n')
        .replaceAll('- [ ]', '- [x]')
        .replace('<!-- Nome Completo -->', 'Karen Vitória Rodrigues Pereira'),
    commits: [
        { sha: 'a'.repeat(40), mensagem: ':sparkles: feat: botão de exportar' },
        { sha: 'b'.repeat(40), mensagem: '💄 style(visualizar): estiliza botões\n\ncorpo' },
        { sha: 'c'.repeat(40), mensagem: "Merge branch 'develop' into feature/exportar-pdf" }
    ],
    arquivos: ['js/visualizar.js', 'CHANGELOG.md'],
    aprovacoes: 1
};

const status = (resultado, nome) => resultado.itens.find(i => i.verificacao === nome)?.status;

describe('Padrão de commits', () => {
    it.each([
        'feat: nova página',
        'fix(projetos): corrige validação #4',
        ':sparkles: feat: adiciona login',
        ':recycle:refactor: ajusta css',
        '✨ feat: adiciona estrutura',
        'feat!: muda formato do localStorage'
    ])('aceita "%s"', msg => expect(regras.commitValido(msg)).toBe(true));

    it.each([
        'update stuff',
        '[PR] - Criação da página inicial',
        'WIP on main: 998898c docs',
        'feat:sem espaço',
        'feature: tipo inexistente'
    ])('rejeita "%s"', msg => expect(regras.commitValido(msg)).toBe(false));
});

describe('Fluxo de branches (GitFlow)', () => {
    it.each([
        ['feature/x', 'develop', true],
        ['fix/x', 'develop', true],
        ['develop', 'release', true],
        ['release', 'main', true],
        ['hotfix/x', 'main', true],
        ['feature/x', 'main', false],
        ['develop', 'main', false],
        ['feature/x', 'release', false]
    ])('%s → %s = %s', (origem, destino, esperado) => {
        expect(regras.fluxoPermitido(origem, destino)).toBe(esperado);
    });
});

describe('Auditoria completa', () => {
    it('PR correto fica CONFORME e sem avisos', () => {
        const r = regras.auditar(prValido);
        expect(r.conforme).toBe(true);
        expect(r.itens.filter(i => i.status !== 'ok')).toEqual([]);
    });

    it('template sem preencher reprova descrição e issue', () => {
        const r = regras.auditar({ ...prValido, corpo: TEMPLATE });
        expect(r.conforme).toBe(false);
        expect(status(r, 'Descrição do PR')).toBe('falha');
        expect(status(r, 'Issue vinculada')).toBe('falha');
        expect(status(r, 'Auditor identificado')).toBe('aviso');
        expect(status(r, 'Checklist de auditoria')).toBe('aviso');
    });

    it('reprova branch fora do padrão e fluxo errado', () => {
        const r = regras.auditar({ ...prValido, origem: 'auditoria', destino: 'main' });
        expect(status(r, 'Nome da branch')).toBe('falha');
        expect(status(r, 'Fluxo de branches')).toBe('falha');
    });

    it('reprova commits fora do padrão listando os SHAs', () => {
        const r = regras.auditar({ ...prValido, commits: [{ sha: '1234567abc', mensagem: 'update stuff' }] });
        const item = r.itens.find(i => i.verificacao === 'Padrão dos commits');
        expect(item.status).toBe('falha');
        expect(item.detalhe).toContain('1234567');
    });

    it('conta apenas os itens da seção de checklist, não os do "Como testar"', () => {
        const comoTestar = '## 🧪 Como testar\n- [ ] Check `Auditoria de configuração` verde\n- [ ] Deploy após o merge\n';
        const corpo = prValido.corpo.replace('## 🧪 Como testar', comoTestar);
        expect(regras.checklistAuditoria(corpo)).toEqual({ total: 6, marcados: 6 });
        expect(status(regras.auditar({ ...prValido, corpo }), 'Checklist de auditoria')).toBe('ok');
    });

    it('avisa quando o CHANGELOG não foi atualizado', () => {
        const r = regras.auditar({ ...prValido, arquivos: ['js/visualizar.js'] });
        expect(status(r, 'CHANGELOG')).toBe('aviso');
        expect(r.conforme).toBe(true);
    });

    it('avisa quando ainda não há revisão aprovada', () => {
        expect(status(regras.auditar({ ...prValido, aprovacoes: 0 }), 'Revisão aprovada')).toBe('aviso');
    });

    describe('release para produção (release → main)', () => {
        const release = { ...prValido, origem: 'release', destino: 'main', changelog: '## [1.1.0] - 2026-11-20\n- x' };

        it('aceita versão nova documentada no CHANGELOG', () => {
            const r = regras.auditar({ ...release, versao: '1.1.0', ultimaTag: 'v1.0.0' });
            expect(status(r, 'Versão')).toBe('ok');
        });

        it('reprova versão que não foi incrementada', () => {
            const r = regras.auditar({ ...release, versao: '1.0.0', ultimaTag: 'v1.0.0' });
            expect(status(r, 'Versão')).toBe('falha');
        });

        it('reprova versão sem seção no CHANGELOG', () => {
            const r = regras.auditar({ ...release, versao: '1.2.0', ultimaTag: 'v1.0.0' });
            expect(status(r, 'Versão')).toBe('falha');
        });
    });

    it('gera relatório em Markdown com o resultado', () => {
        const md = regras.gerarRelatorio(regras.auditar(prValido), { numero: 20, sha: 'abcdef1234' });
        expect(md).toContain('<!-- auditoria-gc -->');
        expect(md).toContain('CONFORME');
        expect(md).toContain('PR #20');
    });
});
