/**
 * Auditoria retroativa do histórico de commits.
 * Aplica as mesmas regras da auditoria automática de PR a todos os commits
 * da branch atual e gera docs/auditoria/relatorio-historico.md.
 *
 * Uso: npm run auditoria:historico
 */
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const { commitValido } = require('../.github/scripts/auditoria-pr.cjs');

const SEP = '\u001f';
const log = execFileSync('git', ['log', '--no-merges', `--format=%h${SEP}%an${SEP}%ad${SEP}%s`, '--date=short'], { encoding: 'utf-8' });
const commits = log.trim().split('\n').filter(Boolean).map(l => {
    const [sha, autor, data, mensagem] = l.split(SEP);
    return { sha, autor, data, mensagem, valido: commitValido(mensagem) };
});
const merges = execFileSync('git', ['log', '--merges', '--format=%s'], { encoding: 'utf-8' }).trim().split('\n').filter(Boolean);
const viaPR = merges.filter(m => /^Merge pull request #\d+/.test(m)).length;

const validos = commits.filter(c => c.valido).length;
const pct = commits.length ? Math.round((validos / commits.length) * 100) : 0;
const esc = s => s.replace(/\|/g, '\\|');

const md = [
    '# Relatório de auditoria do histórico de commits',
    '',
    `Gerado em ${new Date().toISOString().slice(0, 10)} por \`npm run auditoria:historico\`.`,
    'Regra aplicada: Conventional Commits com emoji opcional (a mesma da auditoria automática de PR).',
    '',
    '## Resumo',
    '',
    '| Indicador | Valor |',
    '|---|---|',
    `| Commits analisados (sem merges) | ${commits.length} |`,
    `| Commits conformes | ${validos} (${pct}%) |`,
    `| Commits não conformes | ${commits.length - validos} |`,
    `| Merges via Pull Request | ${viaPR} de ${merges.length} |`,
    '',
    '## Não conformidades encontradas',
    '',
    commits.length - validos
        ? ['| Commit | Data | Autor | Mensagem |', '|---|---|---|---|',
            ...commits.filter(c => !c.valido).map(c => `| \`${c.sha}\` | ${c.data} | ${esc(c.autor)} | ${esc(c.mensagem)} |`)].join('\n')
        : 'Nenhuma.',
    '',
    '**Ação corretiva:** commits já integrados não são reescritos (preservação do histórico). ',
    'A partir da implantação da auditoria automática, PRs com commits fora do padrão são bloqueados antes do merge.',
    '',
    '## Todos os commits',
    '',
    '| | Commit | Data | Autor | Mensagem |',
    '|---|---|---|---|---|',
    ...commits.map(c => `| ${c.valido ? '✅' : '❌'} | \`${c.sha}\` | ${c.data} | ${esc(c.autor)} | ${esc(c.mensagem)} |`),
    ''
].join('\n');

mkdirSync('docs/auditoria', { recursive: true });
writeFileSync('docs/auditoria/relatorio-historico.md', md);
console.log(`✔ ${commits.length} commits auditados — ${validos} conformes (${pct}%). Relatório: docs/auditoria/relatorio-historico.md`);
