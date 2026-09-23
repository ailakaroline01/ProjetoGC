document.addEventListener('DOMContentLoaded', () => {
    const STORAGE_KEY = 'portfolio';
    const skillInput = document.getElementById('skillInput');
    const btnAddSkill = document.getElementById('btnAddSkill');
    const skillsListContainer = document.getElementById('skillsList');
    const errorMsg = document.getElementById('errorMsg');
    const skillsHint = document.getElementById('skillsHint');

    const btnBack = document.getElementById('btnBack');
    const btnFinish = document.getElementById('btnFinish');

    let portfolioData;
    try {
        portfolioData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch {
        portfolioData = {};
    }
    if (typeof portfolioData !== 'object' || Array.isArray(portfolioData)) portfolioData = {};
    let skills = Array.isArray(portfolioData.habilidades)
        ? portfolioData.habilidades.filter(skill => typeof skill === 'string')
        : [];

    function renderSkills() {
        skillsListContainer.innerHTML = '';

        if (skills.length === 0) {
            skillsListContainer.innerHTML = '<span class="empty-message">Nenhuma habilidade cadastrada ainda.</span>';
            skillsHint.style.display = 'none';
            return;
        }

        skillsHint.style.display = 'block';

        skills.forEach((skill, index) => {
            const tag = document.createElement('div');
            tag.className = 'skill-tag';

            const textNode = document.createTextNode(skill);

            const removeBtn = document.createElement('button');
            removeBtn.innerHTML = '×';
            removeBtn.setAttribute('aria-label', `Remover habilidade ${skill}`);
            removeBtn.onclick = () => removeSkill(index);

            tag.appendChild(textNode);
            tag.appendChild(removeBtn);
            skillsListContainer.appendChild(tag);
        });
    }

    function saveSkills() {
        portfolioData.habilidades = skills;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolioData));
    }

    function addSkill() {
        errorMsg.textContent = '';
        const trimmedValue = skillInput.value.trim();

        if (!trimmedValue) {
            errorMsg.textContent = 'A habilidade não pode estar vazia.';
            skillInput.focus();
            return;
        }

        const isDuplicate = skills.some(
            skill => skill.toLowerCase() === trimmedValue.toLowerCase()
        );

        if (isDuplicate) {
            errorMsg.textContent = `A habilidade "${trimmedValue}" já foi adicionada.`;
            skillInput.focus();
            return;
        }

        skills.push(trimmedValue);
        saveSkills();
        renderSkills();
        skillInput.value = '';
        skillInput.focus();
    }

    function removeSkill(index) {
        skills.splice(index, 1);
        saveSkills();
        renderSkills();
    }

    btnAddSkill.addEventListener('click', addSkill);

    skillInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addSkill();
        }
    });

    // Navegação ajustada para o mesmo diretório
    btnBack.addEventListener('click', () => {
        window.location.href = 'projetos.html';
    });

    btnFinish.addEventListener('click', () => {
        saveSkills();
        window.location.href = 'visualizar.html';
    });

    renderSkills();
});