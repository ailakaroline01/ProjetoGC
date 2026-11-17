/**
 * Auditoria automatizada de Pull Requests — Gerência de Configuração.
 *
 * Executado pelo workflow .github/workflows/auditoria-pr.yml a cada PR.
 * Verifica se a mudança segue o processo definido no PGC:
 *   - nome da branch e fluxo de branches (GitFlow);
 *   - padrão das mensagens de commit (Conventional Commits, com emoji opcional);
 *   - descrição do PR e vínculo com issue (controle de mudança);
 *   - CHANGELOG e versionamento (releases para a main);
 *   - checklist manual, auditor identificado e revisão aprovada.
 *
 * O resultado é publicado como comentário no PR, em labels e no resumo do workflow.
 * Itens com status "falha" reprovam o check e (com branch protection) bloqueiam o merge.
 */

const TIPOS_COMMIT = ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'chore', 'revert'];

// Ex. válidos: "feat: x", "feat(auth): x", ":sparkles: feat: x", "✨ feat: x", ":recycle:refactor: x"
const REGEX_COMMIT = new RegExp(
    `^(?:(?::[a-z0-9_+-]+:|\\p{Extended_Pictographic}\\uFE0F?)\\s*)?(${TIPOS_COMMIT.join('|')})(\\([^)]+\\))?!?: \\S`,
    'u'
);

const PREFIXOS_BRANCH = ['feature', 'fix', 'bugfix', 'hotfix', 'docs', 'chore', 'refactor', 'test', 'ci', 'style'];
const REGEX_BRANCH = new RegExp(`^(${PREFIXOS_BRANCH.join('|')})/[a-z0-9][a-z0-9._-]*$`);

// Branches de ambiente (cada uma ligada a um ambiente na Vercel)
const BRANCHES_AMBIENTE = ['develop', 'release', 'main'];

// Fluxo permitido: destino → origens aceitas
const FLUXO = {
    develop: ['feature/*', 'fix/*', 'bugfix/*', 'docs/*', 'chore/*', 'refactor/*', 'test/*', 'ci/*', 'style/*', 'hotfix/*', 'release', 'main'],
    release: ['develop', 'hotfix/*'],
    main: ['release', 'hotfix/*']
};

// Tipos de branch que representam mudança no produto e exigem issue
const EXIGEM_ISSUE = ['feature', 'fix', 'bugfix', 'hotfix'];

const MARCADOR = '<!-- auditoria-gc -->';
const LABEL_OK = 'auditoria: conforme';
const LABEL_FALHA = 'auditoria: não conforme';

// ---------------------------------------------------------------------------
// Regras (funções puras, testadas em tests/auditoria-pr.test.js)
// ---------------------------------------------------------------------------

function commitValido(mensagem) {
    const titulo = String(mensagem || '').split('\n')[0].trim();
    return REGEX_COMMIT.test(titulo);
}

function ehMerge(mensagem) {
    return /^Merge (branch|pull request|remote-tracking branch) /.test(String(mensagem || ''));
}

function tipoDaBranch(branch) {
    return BRANCHES_AMBIENTE.includes(branch) ? branch : branch.split('/')[0];
}

function fluxoPermitido(origem, destino) {
    const permitidas = FLUXO[destino];
    if (!permitidas) return false;
    return permitidas.some(p => (p.endsWith('/*') ? origem.startsWith(p.slice(0, -1)) : origem === p));
}

function semComentarios(texto) {
    return String(texto || '').replace(/<!--[\s\S]*?-->/g, '');
}

/** Texto "livre" escrito pelo autor, ignorando a estrutura do template. */
function conteudoDescricao(corpo) {
    return semComentarios(corpo)
        .split('\n')
        .map(linha => linha.trim())
        .filter(linha =>
            linha &&
            !/^#{1,6}\s/.test(linha) &&                       // títulos
            !/^[-*]\s*\[[ xX]\]/.test(linha) &&               // checkboxes
            !/^(---|\*\*\*|___)$/.test(linha) &&              // separadores
            !/^\*\*Observações:?\*\*:?$/i.test(linha) &&
            !/^[-*]?\s*Auditor:/i.test(linha) &&
            !/^[-*]?\s*_+$/.test(linha) &&
            !/^(closes|fixes|resolves?|issue)\b[^#]*#\s*$/i.test(linha)
        )
        .join(' ');
}

function referenciaIssue(texto) {
    return /(^|[^&\w])#\d+\b/.test(semComentarios(texto));
}

/** Checkboxes da seção "Auditoria de Configuração" do template. */
function checklistAuditoria(corpo) {
    const texto = semComentarios(corpo);
    const inicio = texto.search(/Auditoria de Configura/i);
    if (inicio === -1) return { total: 0, marcados: 0 };
    const secao = texto.slice(inicio);
    const itens = secao.match(/^\s*[-*]\s*\[[ xX]\]/gm) || [];
    const marcados = itens.filter(i => /\[[xX]\]/.test(i)).length;
    return { total: itens.length, marcados };
}

function auditorIdentificado(corpo) {
    const m = semComentarios(corpo).match(/Auditor:[ \t]*([^\n]*)/i);
    const nome = m ? m[1].replace(/[_*<>]/g, '').trim() : '';
    return nome.split(/\s+/).filter(Boolean).length >= 2 ? nome : null; // nome completo
}

function parseSemver(v) {
    const m = String(v || '').replace(/^v/, '').match(/^(\d+)\.(\d+)\.(\d+)$/);
    return m ? m.slice(1).map(Number) : null;
}

function compararSemver(a, b) {
    const [x, y] = [parseSemver(a), parseSemver(b)];
    for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i];
    return 0;
}

/**
 * Executa todas as verificações.
 * @param {object} d
 * @param {string} d.origem      branch de origem (head)
 * @param {string} d.destino     branch de destino (base)
 * @param {string} d.titulo      título do PR
 * @param {string} d.corpo       descrição do PR
 * @param {{sha:string, mensagem:string}[]} d.commits
 * @param {string[]} d.arquivos  arquivos alterados
 * @param {number} d.aprovacoes  quantidade de aprovações
 * @param {string} [d.versao]    versão do package.json
 * @param {string} [d.changelog] conteúdo do CHANGELOG.md
 * @param {string|null} [d.ultimaTag] última tag de versão publicada
 */
function auditar(d) {
    const itens = [];
    const add = (verificacao, status, detalhe) => itens.push({ verificacao, status, detalhe });
    const tipo = tipoDaBranch(d.origem);

    // 1. Nome da branch
    if (BRANCHES_AMBIENTE.includes(d.origem) || REGEX_BRANCH.test(d.origem)) {
        add('Nome da branch', 'ok', `\`${d.origem}\``);
    } else {
        add('Nome da branch', 'falha',
            `\`${d.origem}\` fora do padrão. Use \`<tipo>/<descricao-curta>\` (tipos: ${PREFIXOS_BRANCH.join(', ')}), em minúsculas e sem acentos.`);
    }

    // 2. Fluxo de branches
    if (fluxoPermitido(d.origem, d.destino)) {
        add('Fluxo de branches', 'ok', `\`${d.origem}\` → \`${d.destino}\``);
    } else {
        const esperado = FLUXO[d.destino] ? FLUXO[d.destino].map(b => `\`${b}\``).join(', ') : 'nenhuma (destino não é branch de ambiente)';
        add('Fluxo de branches', 'falha', `\`${d.origem}\` → \`${d.destino}\` não é permitido. Origens aceitas para \`${d.destino}\`: ${esperado}.`);
    }

    // 3. Commits
    const commits = d.commits.filter(c => !ehMerge(c.mensagem));
    const invalidos = commits.filter(c => !commitValido(c.mensagem));
    if (!commits.length) {
        add('Padrão dos commits', 'aviso', 'Nenhum commit (além de merges) encontrado.');
    } else if (!invalidos.length) {
        add('Padrão dos commits', 'ok', `${commits.length} commit(s) no padrão Conventional Commits.`);
    } else if (BRANCHES_AMBIENTE.includes(d.origem)) {
        // Promoções entre ambientes carregam o histórico antigo; não reprovam por isso.
        add('Padrão dos commits', 'aviso', `${invalidos.length} commit(s) antigos fora do padrão no histórico promovido.`);
    } else {
        const lista = invalidos.slice(0, 10)
            .map(c => `\`${c.sha.slice(0, 7)}\` ${String(c.mensagem).split('\n')[0].slice(0, 70)}`)
            .join('<br>');
        add('Padrão dos commits', 'falha',
            `${invalidos.length} de ${commits.length} fora do padrão \`tipo(escopo): descrição\`:<br>${lista}`);
    }

    // 4. Título do PR
    if (commitValido(d.titulo)) {
        add('Título do PR', 'ok', 'Segue o padrão de commits.');
    } else {
        add('Título do PR', 'aviso', 'Recomendado usar o padrão `tipo: descrição` (vira a mensagem do squash merge).');
    }

    // 5. Descrição
    const descricao = conteudoDescricao(d.corpo);
    if (descricao.length >= 20) {
        add('Descrição do PR', 'ok', 'Descrição preenchida.');
    } else {
        add('Descrição do PR', 'falha', 'Descreva o que foi alterado e por quê (mínimo de 20 caracteres além do template).');
    }

    // 6. Issue vinculada (controle de mudança)
    if (referenciaIssue(`${d.titulo}\n${d.corpo}`)) {
        add('Issue vinculada', 'ok', 'Mudança rastreável por issue.');
    } else if (EXIGEM_ISSUE.includes(tipo)) {
        add('Issue vinculada', 'falha', 'Toda mudança `' + tipo + '` deve referenciar uma issue (ex.: `Closes #12`).');
    } else {
        add('Issue vinculada', 'aviso', 'Nenhuma issue referenciada.');
    }

    // 7. CHANGELOG
    const alterouChangelog = d.arquivos.includes('CHANGELOG.md');
    if (d.destino === 'develop' && EXIGEM_ISSUE.includes(tipo)) {
        add('CHANGELOG', alterouChangelog ? 'ok' : 'aviso',
            alterouChangelog ? 'CHANGELOG.md atualizado.' : 'Registre a mudança em `CHANGELOG.md` na seção **Não lançado**.');
    }

    // 8. Versionamento (somente releases para produção)
    if (d.destino === 'main') {
        const versao = d.versao;
        if (!parseSemver(versao)) {
            add('Versão', 'falha', `Versão \`${versao}\` do package.json não segue SemVer (X.Y.Z).`);
        } else if (d.ultimaTag && parseSemver(d.ultimaTag) && compararSemver(versao, d.ultimaTag) <= 0) {
            add('Versão', 'falha', `A versão \`${versao}\` precisa ser maior que a última publicada (\`${d.ultimaTag}\`).`);
        } else if (!new RegExp(`^## \\[${versao.replace(/\./g, '\\.')}\\]`, 'm').test(d.changelog || '')) {
            add('Versão', 'falha', `CHANGELOG.md não tem a seção \`## [${versao}]\`.`);
        } else {
            add('Versão', 'ok', `Release \`v${versao}\` documentada no CHANGELOG.`);
        }
    }

    // 9. Checklist manual
    const { total, marcados } = checklistAuditoria(d.corpo);
    if (!total) {
        add('Checklist de auditoria', 'aviso', 'Checklist do template removido da descrição.');
    } else {
        add('Checklist de auditoria', marcados === total ? 'ok' : 'aviso', `${marcados}/${total} itens marcados.`);
    }

    // 10. Auditor
    const auditor = auditorIdentificado(d.corpo);
    add('Auditor identificado', auditor ? 'ok' : 'aviso',
        auditor ? `Auditor: ${auditor}` : 'Preencha `Auditor: <Nome Completo>` nas observações.');

    // 11. Revisão
    add('Revisão aprovada', d.aprovacoes > 0 ? 'ok' : 'aviso',
        d.aprovacoes > 0 ? `${d.aprovacoes} aprovação(ões).` : 'Aguardando aprovação de pelo menos 1 membro.');

    return { itens, conforme: !itens.some(i => i.status === 'falha') };
}

const ICONE = { ok: '✅', aviso: '⚠️', falha: '❌' };

function gerarRelatorio({ itens, conforme }, pr) {
    const linhas = itens.map(i => `| ${ICONE[i.status]} | ${i.verificacao} | ${i.detalhe} |`);
    const falhas = itens.filter(i => i.status === 'falha').length;
    const avisos = itens.filter(i => i.status === 'aviso').length;
    return [
        MARCADOR,
        '## 🔎 Auditoria de Configuração (automática)',
        '',
        conforme
            ? `**Resultado: ✅ CONFORME** — ${avisos} aviso(s).`
            : `**Resultado: ❌ NÃO CONFORME** — ${falhas} não conformidade(s), ${avisos} aviso(s). Corrija os itens ❌ para liberar o merge.`,
        '',
        '| | Verificação | Detalhe |',
        '|---|---|---|',
        ...linhas,
        '',
        `<sub>PR #${pr.numero} · commit \`${pr.sha.slice(0, 7)}\` · auditado em ${new Date().toISOString().replace('T', ' ').slice(0, 16)} UTC · ` +
        'atualizado automaticamente a cada alteração do PR.</sub>'
    ].join('\n');
}

// ---------------------------------------------------------------------------
// Integração com o GitHub (actions/github-script)
// ---------------------------------------------------------------------------

async function executar({ github, context, core }) {
    const fs = require('node:fs');
    const { owner, repo } = context.repo;
    const pr = context.payload.pull_request;
    const numero = pr.number;

    const commits = await github.paginate(github.rest.pulls.listCommits, { owner, repo, pull_number: numero, per_page: 100 });
    const arquivos = await github.paginate(github.rest.pulls.listFiles, { owner, repo, pull_number: numero, per_page: 100 });
    const reviews = await github.paginate(github.rest.pulls.listReviews, { owner, repo, pull_number: numero, per_page: 100 });

    // Última revisão de cada revisor conta
    const ultimaPorRevisor = new Map();
    for (const r of reviews) if (r.user && r.state !== 'COMMENTED') ultimaPorRevisor.set(r.user.login, r.state);
    const aprovacoes = [...ultimaPorRevisor.values()].filter(s => s === 'APPROVED').length;

    let versao = null;
    let changelog = '';
    try { versao = JSON.parse(fs.readFileSync('package.json', 'utf8')).version; } catch { /* sem package.json */ }
    try { changelog = fs.readFileSync('CHANGELOG.md', 'utf8'); } catch { /* sem changelog */ }

    let ultimaTag = null;
    if (pr.base.ref === 'main') {
        const tags = await github.paginate(github.rest.repos.listTags, { owner, repo, per_page: 100 });
        const versoes = tags.map(t => t.name).filter(parseSemver).sort(compararSemver);
        ultimaTag = versoes.length ? versoes[versoes.length - 1] : null;
    }

    const resultado = auditar({
        origem: pr.head.ref,
        destino: pr.base.ref,
        titulo: pr.title,
        corpo: pr.body || '',
        commits: commits.map(c => ({ sha: c.sha, mensagem: c.commit.message, })),
        arquivos: arquivos.map(f => f.filename),
        aprovacoes,
        versao,
        changelog,
        ultimaTag
    });

    const relatorio = gerarRelatorio(resultado, { numero, sha: pr.head.sha });

    // Comentário único, atualizado a cada execução (histórico fica no "edited")
    const comentarios = await github.paginate(github.rest.issues.listComments, { owner, repo, issue_number: numero, per_page: 100 });
    const existente = comentarios.find(c => c.body && c.body.includes(MARCADOR));
    if (existente) {
        await github.rest.issues.updateComment({ owner, repo, comment_id: existente.id, body: relatorio });
    } else {
        await github.rest.issues.createComment({ owner, repo, issue_number: numero, body: relatorio });
    }

    // Labels de status
    const [adicionar, remover] = resultado.conforme ? [LABEL_OK, LABEL_FALHA] : [LABEL_FALHA, LABEL_OK];
    try {
        await garantirLabel(github, owner, repo, LABEL_OK, '2da44e', 'PR aprovado na auditoria automática de configuração');
        await garantirLabel(github, owner, repo, LABEL_FALHA, 'd73a4a', 'PR com não conformidades na auditoria de configuração');
        await github.rest.issues.addLabels({ owner, repo, issue_number: numero, labels: [adicionar] });
        await github.rest.issues.removeLabel({ owner, repo, issue_number: numero, name: remover }).catch(() => {});
    } catch (erro) {
        core.warning(`Não foi possível atualizar as labels: ${erro.message}`);
    }

    await core.summary.addRaw(relatorio.replace(MARCADOR, '')).write();

    if (!resultado.conforme) {
        core.setFailed('Auditoria de configuração: há não conformidades. Veja o comentário no PR.');
    }
}

async function garantirLabel(github, owner, repo, name, color, description) {
    try {
        await github.rest.issues.getLabel({ owner, repo, name });
    } catch {
        await github.rest.issues.createLabel({ owner, repo, name, color, description });
    }
}

module.exports = {
    auditar,
    gerarRelatorio,
    executar,
    commitValido,
    fluxoPermitido,
    conteudoDescricao,
    referenciaIssue,
    checklistAuditoria,
    auditorIdentificado,
    compararSemver
};
