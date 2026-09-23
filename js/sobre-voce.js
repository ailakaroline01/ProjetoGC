const form = document.getElementById('profile-form');
const fields = ['nome', 'profissao', 'bio', 'email', 'link'];
let saved;
try {
    saved = JSON.parse(localStorage.getItem('portfolio')) || {};
} catch {
    saved = {};
}
if (typeof saved !== 'object' || Array.isArray(saved)) saved = {};
for (const key of fields) {
    const input = document.getElementById(key);
    input.value = typeof saved[key] === 'string' ? saved[key] : '';
    input.addEventListener('input', () => {
        input.setCustomValidity('');
        saveProfile();
    });
}
function saveProfile() {
    for (const key of fields) saved[key] = document.getElementById(key).value.trim();
    try {
        localStorage.setItem('portfolio', JSON.stringify(saved));
        return true;
    } catch {
        document.getElementById('nomeError').textContent = 'Não foi possível salvar os dados neste navegador.';
        return false;
    }
}
form.addEventListener('submit', event => {
    event.preventDefault();
    const name = document.getElementById('nome');
    const link = document.getElementById('link');
    name.setCustomValidity(name.value.trim() ? '' : 'Informe seu nome.');
    link.setCustomValidity(!link.value.trim() || /^https?:\/\//i.test(link.value.trim()) ? '' : 'Informe um link começando com http:// ou https://.');
    if (form.reportValidity() && saveProfile()) window.location.href = 'projetos.html';
});
document.getElementById('btnBack').addEventListener('click', () => {
    if (saveProfile()) window.location.href = 'index.html';
});