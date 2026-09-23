document.addEventListener('DOMContentLoaded', () => {
    const STORAGE_KEY = 'portfolio';
    const skillInput = document.getElementById('skillInput');
    const btnAddSkill = document.getElementById('btnAddSkill');
    const skillsListContainer = document.getElementById('skillsList');
    const errorMsg = document.getElementById('errorMsg');
    const skillsHint = document.getElementById('skillsHint');

    const btnBack = document.getElementById('btnBack');
    const btnFinish = document.getElementById('btnFinish');

    let portfolioData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    let skills = portfolioData.habilidades || [];

    function renderSkills() {
        skillsListContainer.innerHTML = '';

        if (skills.length === 0) {
            skillsListContainer.innerHTML = '<span class="empty-message">Nenhuma habilidade cadastrada ainda.</span>';
            skillsHint.style.display = 'none';
            return;
        }

        skillsHint.style.display = 'block';

        skills.forEach((skill, index) => {
            const tag = document.createElement('div'); document.addEventListener('DOMContentLoaded', () => {
                const STORAGE_KEY = 'portfolio';
                const skillInput = document.getElementById('skillInput');
                const btnAddSkill = document.getElementById('btnAddSkill');
                const skillsListContainer = document.getElementById('skillsList');
                const errorMsg = document.getElementById('errorMsg');
                const skillsHint = document.getElementById('skillsHint');

                // Botoes de Navegação
                const btnBack = document.getElementById('btnBack');
                const btnFinish = document.getElementById('btnFinish');

                // Recuperar dados do localStorage de forma segura
                let portfolioData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
                let skills = portfolioData.habilidades || [];

                // Renderiza a lista de habilidades
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

                // Salva no localStorage preservando o resto
                function saveSkills() {
                    portfolioData.habilidades = skills;
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolioData));
                }

                // Adiciona uma nova habilidade
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

                // Remove habilidade clicada
                function removeSkill(index) {
                    skills.splice(index, 1);
                    saveSkills();
                    renderSkills();
                }

                // Disparadores de Evento
                btnAddSkill.addEventListener('click', addSkill);

                skillInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        addSkill();
                    }
                });

                // Como o arquivo está dentro de paginas/habilidades/, usamos '../' para ir aos arquivos em paginas/
                btnBack.addEventListener('click', () => {
                    window.location.href = '../projetos.html';
                });

                btnFinish.addEventListener('click', () => {
                    saveSkills();
                    window.location.href = '../visualizar.html';
                });

                // Inicia a renderização
                renderSkills();
            });
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