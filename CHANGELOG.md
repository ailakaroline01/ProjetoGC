# Changelog

Todas as mudanças relevantes do Folio são registradas neste arquivo.

O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/)
e o projeto adota [Versionamento Semântico](https://semver.org/lang/pt-BR/) (`MAJOR.MINOR.PATCH`).

- **Não lançado**: mudanças já integradas na `develop`, aguardando a próxima release.
- Ao preparar uma release, a seção vira `## [X.Y.Z] - AAAA-MM-DD` e a versão do `package.json` é atualizada.
- O pipeline de CI/CD cria a tag `vX.Y.Z` e o GitHub Release automaticamente quando a versão chega na `main`.

## [Não lançado]

## [1.1.0] - 2026-11-22

### Adicionado
- Pipeline de CI/CD no GitHub Actions: lint, testes, build, deploy na Vercel por ambiente e geração de versão (#17).
- Auditoria automatizada de Pull Requests (branch, commits, descrição, issue, CHANGELOG, versão, revisão) (#17).
- Template de PR com checklist de auditoria e templates de issue (bug e solicitação de mudança) (#17).
- Testes automatizados das páginas (Vitest + jsdom) e das regras de auditoria (#17).
- Relatório de auditoria retroativa do histórico (`docs/auditoria/relatorio-historico.md`) (#17).

### Alterado
- Rotas da Vercel redirecionadas para a pasta `paginas/`.
- Deploy passa a ser feito pelo pipeline, somente após lint, testes e build aprovados (#17).

### Corrigido
- Seletor `.portfolio-card` duplicado em `css/visualizar.css`, encontrado pelo lint de CSS (#17).
- Testes da auditoria de PR falhando no Windows por quebra de linha CRLF (#19).

## [1.0.1] - 2026-11-14

### Adicionado
- Exportação do portfólio por link, PDF e PNG (#15, #16).

## [1.0.0] - 2026-09-23

### Adicionado
- Página inicial com apresentação do sistema (#1, #6).
- Página "Sobre você" com dados pessoais e contato (#9).
- Cadastro, edição e remoção de projetos com validação de links (#4, #12).
- Inclusão e remoção de habilidades com validação e `localStorage` (#5, #8).
- Visualização do portfólio e portfólio de exemplo (#7).

### Alterado
- Reestruturação de arquivos HTML, CSS e JS em pastas (#13, #14).

### Corrigido
- Correção no HTML da página de visualização (#7).
