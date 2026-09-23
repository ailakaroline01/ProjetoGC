const STORAGE_KEY = "portfolio";

const projectsList = document.getElementById("projects-list");
const emptyProjectsMessage = document.getElementById("empty-projects");
const addProjectButton = document.getElementById("add-project");
const projectsForm = document.getElementById("projects-form");
const backButton = document.getElementById("back-button");

let projects = loadProjects();


/* LOCAL STORAGE */

function readPortfolio() {

    const storedData = localStorage.getItem(STORAGE_KEY);

    if (!storedData) {
        return {};
    }

    try {

        const portfolio = JSON.parse(storedData);

        if (
            portfolio &&
            typeof portfolio === "object" &&
            !Array.isArray(portfolio)
        ) {
            return portfolio;
        }

    } catch (error) {
        console.error(
            "Não foi possível carregar o portfólio.",
            error
        );
    }

    return {};
}


function loadProjects() {

    const portfolio = readPortfolio();

    if (!Array.isArray(portfolio.projetos)) {
        return [];
    }

    return portfolio.projetos.map((project) => ({
        nome:
            typeof project.nome === "string"
                ? project.nome
                : "",

        descricao:
            typeof project.descricao === "string"
                ? project.descricao
                : "",

        link:
            typeof project.link === "string"
                ? project.link
                : ""
    }));
}


function saveProjects() {

    /*
     * Recupera primeiro o objeto inteiro.
     * Dessa forma não apaga dados pessoais
     * nem habilidades.
     */

    const portfolio = readPortfolio();

    portfolio.projetos = projects.map((project) => ({
        nome: project.nome.trim(),
        descricao: project.descricao.trim(),
        link: project.link.trim()
    }));

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(portfolio)
    );
}


/* VALIDAÇÃO */

function isValidLink(link) {

    const value = link.trim();

    /* * Link é opcional.*/

    if (value === "") {
        return true;
    }

    try {

        const url = new URL(value);

        return (
            url.protocol === "http:" ||
            url.protocol === "https:"
        );

    } catch {
        return false;
    }
}


function getProjectErrors(project) {

    const errors = {
        nome: "",
        descricao: "",
        link: ""
    };


    if (project.nome.trim() === "") {
        errors.nome =
            "Informe o nome do projeto.";
    }


    if (project.descricao.trim() === "") {
        errors.descricao =
            "Informe a descrição do projeto.";
    }


    if (!isValidLink(project.link)) {
        errors.link =
            "Informe um link começando com http:// ou https://.";
    }


    return errors;
}


function projectIsValid(project) {

    const errors = getProjectErrors(project);

    return (
        errors.nome === "" &&
        errors.descricao === "" &&
        errors.link === ""
    );
}


function allProjectsAreValid() {

    return projects.every(projectIsValid);
}


/*
 * Salvamento automático somente quando
 * não existe projeto inválido.
 *
 * Dessa forma um projeto com nome vazio,
 * descrição vazia ou link inválido nunca
 * é gravado no localStorage.
 */

function saveIfValid() {

    if (allProjectsAreValid()) {
        saveProjects();
    }
}


/* ERROS VISUAIS */

function showFieldError(input, errorElement, message) {

    errorElement.textContent = message;

    if (message) {
        input.setAttribute("aria-invalid", "true");
    } else {
        input.removeAttribute("aria-invalid");
    }
}


function validateProjectElement(projectElement, index) {

    const project = projects[index];
    const errors = getProjectErrors(project);

    const nameInput =
        projectElement.querySelector(".project-name");

    const descriptionInput =
        projectElement.querySelector(
            ".project-description"
        );

    const linkInput =
        projectElement.querySelector(".project-link");


    showFieldError(
        nameInput,
        projectElement.querySelector(".name-error"),
        errors.nome
    );

    showFieldError(
        descriptionInput,
        projectElement.querySelector(
            ".description-error"
        ),
        errors.descricao
    );

    showFieldError(
        linkInput,
        projectElement.querySelector(".link-error"),
        errors.link
    );


    return projectIsValid(project);
}


/*CRIAÇÃO DOS CAMPOS */

function createProjectElement(project, index) {

    const container = document.createElement("div");

    container.className = "project-item";


    container.innerHTML = `

        <div class="project-field">

            <label for="project-name-${index}">
                Nome do projeto *
            </label>

            <input
                id="project-name-${index}"
                class="project-name"
                type="text"
                autocomplete="off"
                required
                aria-describedby="name-error-${index}"
            >

            <span
                id="name-error-${index}"
                class="error-message name-error"
                aria-live="polite"
            ></span>

        </div>


        <div class="project-field">

            <label for="project-description-${index}">
                Descrição *
            </label>

            <textarea
                id="project-description-${index}"
                class="project-description"
                required
                aria-describedby="description-error-${index}"
            ></textarea>

            <span
                id="description-error-${index}"
                class="error-message description-error"
                aria-live="polite"
            ></span>

        </div>


        <div class="project-field">

            <label for="project-link-${index}">
                Link do projeto (opcional)
            </label>

            <input
                id="project-link-${index}"
                class="project-link"
                type="url"
                placeholder="https://exemplo.com"
                aria-describedby="link-error-${index}"
            >

            <span
                id="link-error-${index}"
                class="error-message link-error"
                aria-live="polite"
            ></span>

        </div>


        <button
            type="button"
            class="remove-project"
        >
            Remover projeto
        </button>

    `;


    const nameInput =
        container.querySelector(".project-name");

    const descriptionInput =
        container.querySelector(
            ".project-description"
        );

    const linkInput =
        container.querySelector(".project-link");


    /*
     * Preenche os valores depois de criar o HTML.
     * Isso evita colocar dados do usuário
     * diretamente dentro do innerHTML.
     */

    nameInput.value = project.nome;
    descriptionInput.value = project.descricao;
    linkInput.value = project.link;


    nameInput.addEventListener("input", () => {

        projects[index].nome =
            nameInput.value;

        if (
            container
                .querySelector(".name-error")
                .textContent
        ) {
            validateProjectElement(
                container,
                index
            );
        }

        saveIfValid();
    });


    descriptionInput.addEventListener(
        "input",
        () => {

            projects[index].descricao =
                descriptionInput.value;

            if (
                container
                    .querySelector(
                        ".description-error"
                    )
                    .textContent
            ) {
                validateProjectElement(
                    container,
                    index
                );
            }

            saveIfValid();
        }
    );


    linkInput.addEventListener("input", () => {

        projects[index].link =
            linkInput.value;

        if (
            container
                .querySelector(".link-error")
                .textContent
        ) {
            validateProjectElement(
                container,
                index
            );
        }

        saveIfValid();
    });


    nameInput.addEventListener(
        "blur",
        () => validateProjectElement(
            container,
            index
        )
    );


    descriptionInput.addEventListener(
        "blur",
        () => validateProjectElement(
            container,
            index
        )
    );


    linkInput.addEventListener(
        "blur",
        () => validateProjectElement(
            container,
            index
        )
    );


    container
        .querySelector(".remove-project")
        .addEventListener("click", () => {

            projects.splice(index, 1);

            renderProjects();

            /*
             * Após remover, se todos os projetos
             * restantes forem válidos, atualiza
             * o localStorage.
             */

            saveIfValid();
        });


    return container;
}


/* RENDERIZAÇÃO*/

function renderProjects() {

    projectsList.innerHTML = "";


    emptyProjectsMessage.hidden =
        projects.length > 0;


    projects.forEach((project, index) => {

        const element =
            createProjectElement(
                project,
                index
            );

        projectsList.appendChild(element);
    });
}


/* ADICIONAR*/

addProjectButton.addEventListener(
    "click",
    () => {

        projects.push({
            nome: "",
            descricao: "",
            link: ""
        });


        renderProjects();


        const nameInputs =
            document.querySelectorAll(
                ".project-name"
            );


        const lastInput =
            nameInputs[nameInputs.length - 1];


        if (lastInput) {
            lastInput.focus();
        }
    }
);


/* VOLTAR*/

backButton.addEventListener("click", () => {

    window.location.href =
        "sobre-voce.html";

});


/* CONTINUAR*/

projectsForm.addEventListener(
    "submit",
    (event) => {

        event.preventDefault();


        /* * Pode continuar sem nenhum projeto. */

        if (projects.length === 0) {

            saveProjects();

            window.location.href =
                "habilidades.html";

            return;
        }


        const projectElements =
            document.querySelectorAll(
                ".project-item"
            );


        let valid = true;


        projectElements.forEach(
            (element, index) => {

                if (
                    !validateProjectElement(
                        element,
                        index
                    )
                ) {
                    valid = false;
                }

            }
        );


        if (!valid) {

            const firstInvalidField =
                document.querySelector(
                    '[aria-invalid="true"]'
                );


            if (firstInvalidField) {
                firstInvalidField.focus();
            }


            return;
        }


        saveProjects();


        window.location.href =
            "habilidades.html";
    }
);


/*  INICIALIZAÇÃO */

renderProjects();