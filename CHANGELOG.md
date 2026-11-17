# Changelog

Todas as mudanças relevantes do Folio são registradas neste arquivo.

O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/)
e o projeto adota [Versionamento Semântico](https://semver.org/lang/pt-BR/) (`MAJOR.MINOR.PATCH`).

- **Não lançado**: mudanças já integradas na `develop`, aguardando a próxima release.
- Ao preparar uma release, a seção vira `## [X.Y.Z] - AAAA-MM-DD` e a versão do `package.json` é atualizada.
- O pipeline de CI/CD cria a tag `vX.Y.Z` e o GitHub Release automaticamente quando a versão chega na `main`.

## [Não lançado]

## [1.0.0] - 2026-11-17

### Adicionado
- Página inicial com apresentação do sistema (#1, #6).
- Página "Sobre você" com dados pessoais e contato (#9).
- Cadastro, edição e remoção de projetos com validação de links (#4, #12).
- Inclusão e remoção de habilidades com validação e `localStorage` (#5, #8).
- Visualização do portfólio e portfólio de exemplo (#7).
- Exportação do portfólio por link, PDF e PNG (#15, #16).
- Pipeline de CI/CD no GitHub Actions: lint, testes, build, deploy na Vercel por ambiente e geração de versão.
- Auditoria automatizada de Pull Requests (branch, commits, descrição, issue, CHANGELOG, versão, revisão).
- Template de PR com checklist de auditoria e templates de issue (bug e solicitação de mudança).
- Testes automatizados das páginas (Vitest + jsdom) e das regras de auditoria.
- Relatório de auditoria retroativa do histórico (`docs/auditoria/relatorio-historico.md`).

### Alterado
- Reestruturação de arquivos HTML, CSS e JS em pastas (#13, #14).
- Rotas da Vercel redirecionadas para a pasta `paginas/`.
- Deploy passa a ser feito pelo pipeline (somente após lint, testes e build aprovados).

### Corrigido
- Correção no HTML da página de visualização (#7).
- Seletor `.portfolio-card` duplicado em `css/visualizar.css` (encontrado pelo lint de CSS).
