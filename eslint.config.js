import js from '@eslint/js';
import globals from 'globals';

export default [
    {
        ignores: ['node_modules/', 'dist/', 'reports/', 'coverage/']
    },
    js.configs.recommended,
    {
        // Código do site: scripts clássicos executados no navegador
        files: ['js/**/*.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'script',
            globals: {
                ...globals.browser,
                html2canvas: 'readonly'
            }
        },
        rules: {
            'no-unused-vars': 'warn'
        }
    },
    {
        // Ferramentas de build, testes e configuração (Node.js)
        files: ['scripts/**/*.mjs', 'tests/**/*.js', '*.config.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: { ...globals.node }
        }
    },
    {
        // Script da auditoria automática (executado pelo actions/github-script)
        files: ['.github/scripts/**/*.cjs'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'commonjs',
            globals: { ...globals.node }
        }
    }
];
