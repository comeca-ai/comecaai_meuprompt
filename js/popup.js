document.addEventListener('DOMContentLoaded', () => {
    // Elementos da UI
    const sidebarLinks = document.querySelectorAll('.sidebar nav li');
    const views = document.querySelectorAll('.main-content .view');
    const newPromptBtn = document.getElementById('newPromptBtn');
    const newFolderBtn = document.getElementById('newFolderBtn');
    const promptModal = document.getElementById('promptModal');
    const folderModal = document.getElementById('folderModal');
    const closeModalButtons = document.querySelectorAll('.close-button, .close-folder-button');
    const savePromptBtn = document.getElementById('savePromptBtn');
    const saveFolderBtn = document.getElementById('saveFolderBtn');
    const promptTitleInput = document.getElementById('promptTitle');
    const promptContentInput = document.getElementById('promptContent');
    const promptFolderSelect = document.getElementById('promptFolderSelect');
    const folderNameInput = document.getElementById('folderName');
    const promptListContainer = document.querySelector('#promptsView .prompt-list-container');
    const searchInput = document.getElementById('searchInput');
    const modalTitle = document.getElementById('modalTitle');

    let editingPromptId = null; // Para rastrear se estamos editando um prompt existente

    // Estado da aplicação (simulando chrome.storage por enquanto para desenvolvimento)
    let appData = {
        prompts: [],
        folders: [],
        nextPromptId: 1,
        nextFolderId: 1,
    };

    // --- Navegação ---
    sidebarLinks.forEach(link => {
        link.addEventListener('click', () => {
            sidebarLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            const viewName = link.getAttribute('data-view');
            views.forEach(view => {
                view.classList.remove('active-view');
                if (view.id === `${viewName}View`) {
                    view.classList.add('active-view');
                }
            });
            if (viewName === 'marketplace') loadMarketplacePrompts();
        });
    });

    // --- Modais ---
    newPromptBtn.addEventListener('click', () => {
        editingPromptId = null;
        modalTitle.textContent = 'Novo Prompt';
        promptTitleInput.value = '';
        promptContentInput.value = '';
        promptFolderSelect.value = ''; // Resetar seleção de pasta
        loadFoldersIntoSelect();
        promptModal.style.display = 'block';
    });

    newFolderBtn.addEventListener('click', () => {
        folderNameInput.value = '';
        folderModal.style.display = 'block';
    });

    closeModalButtons.forEach(button => {
        button.addEventListener('click', () => {
            promptModal.style.display = 'none';
            folderModal.style.display = 'none';
        });
    });

    window.addEventListener('click', (event) => {
        if (event.target === promptModal) {
            promptModal.style.display = 'none';
        }
        if (event.target === folderModal) {
            folderModal.style.display = 'none';
        }
    });

    // --- Gerenciamento de Pastas ---
    function loadFoldersIntoSelect() {
        promptFolderSelect.innerHTML = '<option value="">Nenhuma</option>'; // Opção padrão
        appData.folders.forEach(folder => {
            const option = document.createElement('option');
            option.value = folder.id;
            option.textContent = folder.name;
            promptFolderSelect.appendChild(option);
        });
    }

    saveFolderBtn.addEventListener('click', () => {
        const folderName = folderNameInput.value.trim();
        if (folderName) {
            const newFolder = {
                id: `f${appData.nextFolderId++}`,
                name: folderName
            };
            appData.folders.push(newFolder);
            saveData();
            renderPrompts(); // Atualiza a UI, incluindo a lista de pastas na sidebar se implementado
            loadFoldersIntoSelect(); // Atualiza o select no modal de prompts
            folderModal.style.display = 'none';
            showToast('Pasta criada com sucesso!');
            // TODO: Atualizar a lista de pastas na sidebar
        } else {
            alert('O nome da pasta não pode estar vazio.');
        }
    });


    // --- Gerenciamento de Prompts ---
    savePromptBtn.addEventListener('click', () => {
        const title = promptTitleInput.value.trim();
        const content = promptContentInput.value.trim();
        const folderId = promptFolderSelect.value;

        if (title && content) {
            if (editingPromptId) {
                // Editar prompt existente
                const promptIndex = appData.prompts.findIndex(p => p.id === editingPromptId);
                if (promptIndex > -1) {
                    appData.prompts[promptIndex].title = title;
                    appData.prompts[promptIndex].content = content;
                    appData.prompts[promptIndex].folderId = folderId || null;
                }
                showToast('Prompt atualizado com sucesso!');
            } else {
                // Novo prompt
                const newPrompt = {
                    id: `p${appData.nextPromptId++}`,
                    title: title,
                    content: content,
                    folderId: folderId || null, // Armazena null se nenhuma pasta for selecionada
                    createdAt: new Date().toISOString()
                };
                appData.prompts.push(newPrompt);
                showToast('Prompt salvo com sucesso!');
            }
            saveData();
            renderPrompts();
            promptModal.style.display = 'none';
            editingPromptId = null;
        } else {
            alert('Título e conteúdo do prompt são obrigatórios.');
        }
    });

    function renderPrompts(searchTerm = '') {
        promptListContainer.innerHTML = ''; // Limpa a lista atual

        const filteredPrompts = appData.prompts.filter(prompt =>
            prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            prompt.content.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (filteredPrompts.length === 0) {
            promptListContainer.innerHTML = '<p>Nenhum prompt encontrado. Clique em "+ Novo Prompt" para adicionar ou ajuste sua busca.</p>';
            return;
        }

        filteredPrompts.forEach(prompt => {
            const promptElement = document.createElement('div');
            promptElement.classList.add('prompt-item');
            promptElement.dataset.id = prompt.id;

            const promptTitle = document.createElement('h3');
            promptTitle.textContent = prompt.title;

            const promptContentPreview = document.createElement('p');
            promptContentPreview.textContent = prompt.content.substring(0, 100) + (prompt.content.length > 100 ? '...' : ''); // Preview

            const actionsDiv = document.createElement('div');
            actionsDiv.classList.add('prompt-actions');

            const copyBtn = createActionButton('Copiar', '../icons/copy.png', () => copyPrompt(prompt.content));
            const editBtn = createActionButton('Editar', '../icons/edit.png', () => editPrompt(prompt.id));
            const deleteBtn = createActionButton('Excluir', '../icons/delete.png', () => deletePrompt(prompt.id));
            const viewBtn = createActionButton('Visualizar', '../icons/eye.png', () => togglePromptView(promptElement, prompt.content));


            actionsDiv.append(viewBtn, copyBtn, editBtn, deleteBtn);
            promptElement.append(promptTitle, promptContentPreview, actionsDiv);
            promptListContainer.appendChild(promptElement);
        });
    }

    function createActionButton(title, iconSrc, onClick) {
        const button = document.createElement('button');
        button.title = title;
        const img = document.createElement('img');
        img.src = iconSrc;
        img.alt = title;
        button.appendChild(img);
        button.addEventListener('click', (e) => {
            e.stopPropagation(); // Evita que o clique no botão acione outros eventos no card
            onClick();
        });
        return button;
    }

    function togglePromptView(promptElement, fullContent) {
        const contentP = promptElement.querySelector('p');
        const isFullView = promptElement.classList.toggle('prompt-item-full');
        if (isFullView) {
            contentP.textContent = fullContent;
        } else {
            contentP.textContent = fullContent.substring(0, 100) + (fullContent.length > 100 ? '...' : '');
        }
    }


    function copyPrompt(content) {
        navigator.clipboard.writeText(content)
            .then(() => showToast('Prompt copiado para a área de transferência!'))
            .catch(err => {
                console.error('Erro ao copiar prompt:', err);
                showToast('Erro ao copiar prompt.', 'error');
            });
    }

    function editPrompt(promptId) {
        const promptToEdit = appData.prompts.find(p => p.id === promptId);
        if (promptToEdit) {
            editingPromptId = promptId;
            modalTitle.textContent = 'Editar Prompt';
            promptTitleInput.value = promptToEdit.title;
            promptContentInput.value = promptToEdit.content;
            promptFolderSelect.value = promptToEdit.folderId || "";
            loadFoldersIntoSelect(); // Garante que as pastas estejam carregadas
            promptFolderSelect.value = promptToEdit.folderId || ""; // Define o valor após carregar
            promptModal.style.display = 'block';
        }
    }

    function deletePrompt(promptId) {
        if (confirm('Tem certeza que deseja excluir este prompt?')) {
            appData.prompts = appData.prompts.filter(p => p.id !== promptId);
            saveData();
            renderPrompts();
            showToast('Prompt excluído com sucesso!');
        }
    }

    // --- Busca ---
    searchInput.addEventListener('input', (e) => {
        renderPrompts(e.target.value);
    });

    // --- Armazenamento de Dados (chrome.storage) ---
    function saveData() {
        if (chrome && chrome.storage && chrome.storage.local) {
            chrome.storage.local.set({ myPromptsData: appData }, () => {
                // console.log('Dados salvos no chrome.storage');
            });
        } else {
            // Fallback para localStorage se chrome.storage não estiver disponível (para testes fora da extensão)
            localStorage.setItem('myPromptsData', JSON.stringify(appData));
            // console.log('Dados salvos no localStorage (fallback)');
        }
    }

    function loadData() {
        if (chrome && chrome.storage && chrome.storage.local) {
            chrome.storage.local.get('myPromptsData', (result) => {
                if (result.myPromptsData) {
                    appData = result.myPromptsData;
                    // Garante que nextId's sejam números e não strings após carregar do storage
                    appData.nextPromptId = parseInt(appData.nextPromptId, 10) || 1;
                    appData.nextFolderId = parseInt(appData.nextFolderId, 10) || 1;
                     if (!appData.folders) appData.folders = []; // Garante que folders exista
                } else {
                    // Inicializa com dados padrão se não houver nada salvo
                    appData = { prompts: [], folders: [], nextPromptId: 1, nextFolderId: 1 };
                }
                renderPrompts();
                loadFoldersIntoSelect(); // Carrega pastas no select ao iniciar
            });
        } else {
            // Fallback para localStorage
            const localData = localStorage.getItem('myPromptsData');
            if (localData) {
                appData = JSON.parse(localData);
                appData.nextPromptId = parseInt(appData.nextPromptId, 10) || 1;
                appData.nextFolderId = parseInt(appData.nextFolderId, 10) || 1;
                if (!appData.folders) appData.folders = [];
            } else {
                 appData = { prompts: [], folders: [], nextPromptId: 1, nextFolderId: 1 };
            }
            renderPrompts();
            loadFoldersIntoSelect();
        }
    }

    // --- Marketplace (Simulação) ---
    function loadMarketplacePrompts() {
        const marketplaceView = document.getElementById('marketplaceView');
        const marketplaceGrid = marketplaceView.querySelector('.marketplace-grid');
        marketplaceGrid.innerHTML = '<p>Carregando prompts do marketplace...</p>';

        // Simulação de carregamento de dados
        setTimeout(() => {
            const sampleMarketplacePrompts = [
                { id: 'mkt1', title: 'Gerador de Ideias para Posts', content: 'Crie 5 ideias de posts para redes sociais sobre [TEMA].', tags: ['Redes Sociais', 'Marketing'], author: 'Comunidade' },
                { id: 'mkt2', title: 'Resumidor de Textos Longos', content: 'Resuma o seguinte texto em 3 pontos principais: [TEXTO LONGO]', tags: ['Produtividade', 'Escrita'], author: 'ExpertAI' },
                { id: 'mkt3', title: 'Tradutor Inglês-Português', content: 'Traduza para o português: [TEXTO EM INGLÊS]', tags: ['Tradução', 'Idiomas'], author: 'PolyglotBot' },
                { id: 'mkt4', title: 'Criador de E-mails Formais', content: 'Escreva um e-mail formal para [DESTINATÁRIO] sobre [ASSUNTO], solicitando [PEDIDO].', tags: ['Comunicação', 'Profissional'], author: 'ProWriter' }
            ];

            marketplaceGrid.innerHTML = ''; // Limpa a mensagem de carregamento

            if (sampleMarketplacePrompts.length === 0) {
                marketplaceGrid.innerHTML = '<p>Nenhum prompt disponível no marketplace no momento.</p>';
                return;
            }

            sampleMarketplacePrompts.forEach(prompt => {
                const item = document.createElement('div');
                item.classList.add('marketplace-item');
                item.innerHTML = `
                    <h3>${prompt.title}</h3>
                    <p>${prompt.content.substring(0,80)}...</p>
                    <div class="tags">
                        ${prompt.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                    <button class="add-to-my-prompts-btn" data-prompt-id="${prompt.id}">Adicionar aos Meus Prompts</button>
                `;
                marketplaceGrid.appendChild(item);

                item.querySelector('.add-to-my-prompts-btn').addEventListener('click', () => {
                    addMarketplacePromptToUser(prompt);
                });
            });
        }, 1000); // Simula delay de rede
    }

    function addMarketplacePromptToUser(marketplacePrompt) {
        // Verifica se o prompt já existe (uma verificação simples pelo título)
        if (appData.prompts.some(p => p.title === marketplacePrompt.title && p.content === marketplacePrompt.content)) {
            showToast('Este prompt já existe em "Meus Prompts".', 'warning');
            return;
        }

        const newPrompt = {
            id: `p${appData.nextPromptId++}`,
            title: marketplacePrompt.title,
            content: marketplacePrompt.content,
            folderId: null, // Adiciona à raiz por padrão
            createdAt: new Date().toISOString(),
            fromMarketplace: true // Marca como vindo do marketplace
        };
        appData.prompts.push(newPrompt);
        saveData();
        renderPrompts(); // Atualiza a lista de prompts do usuário
        showToast(`"${marketplacePrompt.title}" adicionado aos Meus Prompts!`);
    }


    // --- Toast Notifications ---
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('show');
        }, 10); // Pequeno delay para transição
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300); // Espera a transição de saída
        }, 3000); // Duração do toast
    }
     // Adicionar estilos para o Toast no CSS (ou aqui dinamicamente se preferir)
    const styleSheet = document.createElement("style")
    styleSheet.type = "text/css"
    styleSheet.innerText = `
        .toast {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background-color: #333;
            color: white;
            padding: 12px 20px;
            border-radius: 5px;
            z-index: 2000;
            font-size: 14px;
            opacity: 0;
            transition: opacity 0.3s ease, bottom 0.3s ease;
        }
        .toast.show {
            opacity: 1;
            bottom: 30px;
        }
        .toast-success { background-color: #4CAF50; }
        .toast-error { background-color: #f44336; }
        .toast-warning { background-color: #ff9800; color: #333 }
    `;
    document.head.appendChild(styleSheet);


    // Inicialização
    loadData();
});
