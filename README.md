# Folio - Sistema de Portfólios

O Folio é um site para criar portfólios de forma simples. O usuário pode preencher seus dados pessoais, adicionar projetos e habilidades e visualizar tudo em uma página organizada.


## Funcionalidades do MVP

Esta primeira versão é um **MVP** e inclui:

- Página inicial com apresentação do sistema.
- Formulário com nome, apresentação e informações de contato.
- Cadastro, edição e remoção de projetos.
- Inclusão e remoção de habilidades.
- Visualização do portfólio e de um exemplo pronto.

Os dados serão salvos no próprio navegador, utilizando `localStorage`. Não haverá login ou banco de dados no momento.

## Tecnologias

- HTML5
- CSS3
- JavaScript
- Git e GitHub
- GitHub Actions (CI/CD e auditoria automática)
- Vercel (hospedagem dos ambientes)
- Vitest + jsdom, ESLint, Stylelint e HTMLHint (testes e qualidade)

## Gerência de Configuração e DevOps

| Branch | Ambiente |
|---|---|
| `develop` | Desenvolvimento (Preview) |
| `release` | Release / homologação (Preview) |
| `main` | Produção |

- Toda mudança nasce em uma issue, é feita em uma branch `feature/*` ou `fix/*` e entra na `develop` por Pull Request.
- Cada PR passa pelo pipeline de **CI** (lint, testes e build) e pela **auditoria automática**, que comenta no PR o resultado.
- O **CD** publica cada branch no seu ambiente na Vercel, somente se o CI passar. Na `main`, gera a tag e o Release da versão.
- Commits seguem o padrão [Conventional Commits](https://www.conventionalcommits.org/pt-br/), por exemplo `feat(projetos): valida link`.
- Mudanças por versão: [CHANGELOG.md](CHANGELOG.md). Detalhes da automação: [docs/CI-CD-e-auditoria.md](docs/CI-CD-e-auditoria.md).

### Comandos

```bash
npm install                  # instala as ferramentas
npm run lint                 # verifica HTML, CSS e JS
npm test                     # executa os testes
npm run build                # gera o build em dist/
npm run ci                   # tudo acima, como no pipeline
npm run auditoria:historico  # auditoria retroativa dos commits
```

## Como funciona

O usuário segue o fluxo:

**Início → Sobre você → Projetos → Habilidades → Visualizar**

Após preencher as informações, poderá visualizar o resultado e voltar para editar. A página inicial também permitirá conhecer um portfólio de exemplo.

## Próximas versões

Futuramente, o sistema poderá permitir a exportação do portfólio em PDF e o compartilhamento por link. Essas funcionalidades não fazem parte do MVP.

### Desenvolvedores:
- Aila Karoline Santana Moreira
- Ennoile Raquel Martins Ferreira
- Gustavo de Oliveira Pena
- Heloíse Vitória Cruz Brito
- Karen Vitória Rodrigues Pereira