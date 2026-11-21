# CI/CD e Auditoria — Guia de configuração e uso

Este documento descreve a automação de Gerência de Configuração do Folio e os passos
de configuração no GitHub e na Vercel. Ele complementa o Plano de Gerência de Configuração (PGC).

## 1. Visão geral do fluxo

```
feature/* ──PR──► develop ──PR──► release ──PR──► main
                     │               │              │
                     ▼               ▼              ▼
               development        release       production   (ambientes na Vercel)
                                                    │
                                                    ▼
                                         tag vX.Y.Z + GitHub Release
```

| Branch | Papel | Ambiente | Tipo na Vercel |
|---|---|---|---|
| `feature/*`, `fix/*`… | desenvolvimento de uma mudança (ligada a uma issue) | — (só CI) | — |
| `develop` | integração das mudanças | `development` | Preview |
| `release` | homologação da próxima versão | `release` | Preview |
| `main` | produção | `production` | Production |
| `hotfix/*` | correção urgente a partir da `main` | — | — |

## 2. Itens de configuração da automação

| Arquivo | Função |
|---|---|
| `.github/workflows/ci-cd.yml` | Pipeline: lint → testes → build → deploy → versão |
| `.github/workflows/auditoria-pr.yml` | Auditoria automática a cada PR |
| `.github/scripts/auditoria-pr.cjs` | Regras da auditoria |
| `.github/pull_request_template.md` | Checklist manual de auditoria no PR |
| `.github/ISSUE_TEMPLATE/` | Registro de bugs e solicitações de mudança |
| `scripts/build.mjs` | Build: valida referências, gera `dist/` e `version.json` |
| `scripts/auditoria-historico.mjs` | Auditoria retroativa dos commits |
| `tests/` | Testes automatizados (Vitest + jsdom) |
| `vercel.json` | Configuração de build e rotas da Vercel |
| `CHANGELOG.md` | Registro de mudanças por versão |

## 3. Pipeline de CI/CD (`ci-cd.yml`)

| Evento | Lint | Testes | Build | Deploy | Versão |
|---|---|---|---|---|---|
| Pull Request para `develop`/`release`/`main` | ✅ | ✅ | ✅ | — | — |
| Push em `develop` | ✅ | ✅ | ✅ | `development` | — |
| Push em `release` | ✅ | ✅ | ✅ | `release` | — |
| Push em `main` | ✅ | ✅ | ✅ | `production` | tag + Release |

- **Lint**: HTMLHint (HTML), Stylelint (CSS), ESLint (JS).
- **Testes**: carregam as páginas reais em um navegador simulado e verificam cadastro, validação,
  `localStorage`, visualização e compartilhamento. O relatório (`junit.xml`) fica salvo como artefato.
- **Build**: valida que todo CSS/JS/imagem/link referenciado existe e gera `dist/version.json`
  (versão, commit, branch e ambiente). Acesse `/version.json` em cada ambiente para ver qual versão está publicada.
- **Deploy**: feito pela Vercel CLI **somente se as etapas anteriores passarem**. O deploy automático da
  Vercel via Git está desligado (`"git": { "deploymentEnabled": false }`), então nada chega a um ambiente sem passar pelo CI.
- **Versão**: na `main`, lê a versão do `package.json`, cria a tag `vX.Y.Z` e o GitHub Release com as notas do CHANGELOG.

## 4. Auditoria automática de PR (`auditoria-pr.yml`)

Roda quando o PR é aberto, editado, recebe commits ou é revisado. Publica **um comentário** (atualizado a cada execução),
aplica a label `auditoria: conforme` ou `auditoria: não conforme` e grava o relatório no resumo da execução.

| Verificação | Regra | Se falhar |
|---|---|---|
| Nome da branch | `<tipo>/<descricao>` (feature, fix, bugfix, hotfix, docs, chore, refactor, test, ci, style) | ❌ bloqueia |
| Fluxo de branches | ver tabela da seção 1 | ❌ bloqueia |
| Padrão dos commits | `tipo(escopo): descrição`, emoji opcional (`:sparkles: feat: …`) | ❌ bloqueia |
| Descrição do PR | texto próprio além do template | ❌ bloqueia |
| Issue vinculada | `#N` no título/descrição (obrigatório para feature/fix/hotfix) | ❌ bloqueia |
| Versão (PR para `main`) | versão SemVer maior que a última tag e com seção no CHANGELOG | ❌ bloqueia |
| Título do PR | segue o padrão de commits | ⚠️ aviso |
| CHANGELOG | atualizado em mudanças de produto | ⚠️ aviso |
| Checklist de auditoria | todos os itens marcados | ⚠️ aviso |
| Auditor identificado | `Auditor: <Nome Completo>` nas observações | ⚠️ aviso |
| Revisão aprovada | ≥ 1 aprovação | ⚠️ aviso (exigida pela branch protection) |

Auditoria retroativa do histórico: `npm run auditoria:historico` → `docs/auditoria/relatorio-historico.md`.

## 5. Configuração (uma única vez)

### 5.1 Vercel — token e IDs
1. Vercel → *Account Settings → Tokens* → crie um token (ex.: `github-actions-folio`).
2. No terminal, na pasta do projeto: `npx vercel@65.9.0 link` e escolha o projeto existente.
   Isso cria `.vercel/project.json` (já está no `.gitignore`) com `orgId` e `projectId`.

### 5.2 GitHub — secrets
*Settings → Secrets and variables → Actions → New repository secret*:

| Secret | Valor |
|---|---|
| `VERCEL_TOKEN` | token criado no passo 5.1 |
| `VERCEL_ORG_ID` | `orgId` do `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | `projectId` do `.vercel/project.json` |

### 5.3 GitHub — environments
*Settings → Environments → New environment*: crie `development`, `release` e `production`.
- Em `production`, opcional: **Required reviewers** (aprovação manual antes do deploy em produção)
  e **Deployment branches** = somente `main`.
- Opcional: em cada environment, a variável `VERCEL_ALIAS` com um domínio fixo
  (ex.: `folio-develop.vercel.app`, `folio-release.vercel.app`).

### 5.4 GitHub — proteção de branches
*Settings → Branches → Add branch ruleset* (ou *Add rule*) para `main`, `release` e `develop`:
- ✅ Require a pull request before merging → **Require approvals: 1**
- ✅ Require status checks to pass → `Lint (HTML, CSS, JS)`, `Testes`, `Build`, `Auditoria de configuração`
- ✅ Block force pushes

### 5.5 Branch `release`
Crie a branch `release` a partir da `develop` (pelo GitHub ou `git push origin develop:release`).

## 6. Como gerar uma nova versão
1. PR `develop` → `release`. O pipeline publica no ambiente `release` para homologação.
2. Na `release`: atualize `version` no `package.json` e transforme `## [Não lançado]` em `## [X.Y.Z] - data` no CHANGELOG
   (via branch `chore/release-X.Y.Z` → PR para `release`).
3. PR `release` → `main`. A auditoria confere versão e CHANGELOG.
4. Após o merge, o pipeline publica em produção e cria a tag `vX.Y.Z` e o GitHub Release.
5. Faça o PR `main` → `develop` para manter as branches sincronizadas.
