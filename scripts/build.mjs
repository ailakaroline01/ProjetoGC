/**
 * Build do Folio.
 *
 * O site é estático (HTML, CSS e JS puros), então o "build" consiste em:
 *   1. Validar que todo arquivo local referenciado nas páginas existe
 *      (CSS, JS, imagens e links entre páginas) — um link quebrado falha o build.
 *   2. Copiar apenas os arquivos publicáveis para a pasta dist/.
 *   3. Gerar dist/version.json com a versão, commit e branch do build,
 *      garantindo a rastreabilidade de qual configuração está em cada ambiente.
 *
 * Executado pelo GitHub Actions (CI) e pela Vercel (CD).
 */
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const PUBLIC_DIRS = ['paginas', 'css', 'js', 'assets'];

const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'));

// 1. Validação de referências locais nas páginas HTML
const erros = [];
const paginasDir = join(ROOT, 'paginas');
const paginas = readdirSync(paginasDir).filter(nome => nome.endsWith('.html'));

for (const pagina of paginas) {
    const html = readFileSync(join(paginasDir, pagina), 'utf-8');
    const referencias = [...html.matchAll(/\s(?:href|src)="([^"]+)"/g)].map(m => m[1]);

    for (const ref of referencias) {
        if (/^(https?:|mailto:|tel:|data:|#|\/\/)/.test(ref)) continue; // externos e âncoras
        const caminho = ref.split(/[?#]/)[0];
        if (!caminho) continue;
        if (!existsSync(resolve(paginasDir, caminho))) {
            erros.push(`paginas/${pagina}: referência quebrada "${ref}"`);
        }
    }
}

if (erros.length) {
    console.error('Build falhou — referências inválidas encontradas:');
    erros.forEach(erro => console.error(`  ✖ ${erro}`));
    process.exit(1);
}

// 2. Cópia dos arquivos publicáveis
rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST);
for (const dir of PUBLIC_DIRS) {
    cpSync(join(ROOT, dir), join(DIST, dir), { recursive: true });
}

// 3. Metadados da versão (rastreabilidade do item de configuração publicado)
const versao = {
    versao: pkg.version,
    commit: process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || 'local',
    branch: process.env.VERCEL_GIT_COMMIT_REF || process.env.GITHUB_REF_NAME || 'local',
    ambiente: process.env.VERCEL_ENV || (process.env.CI ? 'ci' : 'local'),
    geradoEm: new Date().toISOString()
};
writeFileSync(join(DIST, 'version.json'), JSON.stringify(versao, null, 2) + '\n');

console.log(`✔ ${paginas.length} páginas validadas`);
console.log(`✔ Build v${versao.versao} gerado em dist/ (branch: ${versao.branch}, ambiente: ${versao.ambiente})`);
