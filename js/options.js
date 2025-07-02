document.addEventListener('DOMContentLoaded', () => {
    const themeSelect = document.getElementById('themeSelect');
    const notificationsCheckbox = document.getElementById('notificationsCheckbox');
    const backupFrequency = document.getElementById('backupFrequency');
    const saveOptionsBtn = document.getElementById('saveOptionsBtn');
    const importDataBtn = document.getElementById('importDataBtn');
    const exportDataBtn = document.getElementById('exportDataBtn');
    const importFile = document.getElementById('importFile');
    const statusMessage = document.getElementById('statusMessage');

    const defaultConfig = {
        theme: 'light',
        notifications: true,
        backupFrequency: 'weekly'
    };

    // Carregar configurações salvas
    function loadOptions() {
        if (chrome && chrome.storage && chrome.storage.sync) {
            chrome.storage.sync.get('meuPromptOptions', (data) => {
                const options = { ...defaultConfig, ...data.meuPromptOptions };
                themeSelect.value = options.theme;
                notificationsCheckbox.checked = options.notifications;
                backupFrequency.value = options.backupFrequency;
            });
        } else {
            // Fallback para localStorage se chrome.storage.sync não estiver disponível
            const localOptions = localStorage.getItem('meuPromptOptions');
            if (localOptions) {
                const options = { ...defaultConfig, ...JSON.parse(localOptions) };
                themeSelect.value = options.theme;
                notificationsCheckbox.checked = options.notifications;
                backupFrequency.value = options.backupFrequency;
            } else {
                // Usa defaults
                themeSelect.value = defaultConfig.theme;
                notificationsCheckbox.checked = defaultConfig.notifications;
                backupFrequency.value = defaultConfig.backupFrequency;
            }
        }
    }

    // Salvar configurações
    saveOptionsBtn.addEventListener('click', () => {
        const options = {
            theme: themeSelect.value,
            notifications: notificationsCheckbox.checked,
            backupFrequency: backupFrequency.value
        };

        if (chrome && chrome.storage && chrome.storage.sync) {
            chrome.storage.sync.set({ meuPromptOptions: options }, () => {
                showStatus('Configurações salvas com sucesso!', 'success');
            });
        } else {
            localStorage.setItem('meuPromptOptions', JSON.stringify(options));
            showStatus('Configurações salvas localmente!', 'success');
        }
    });

    // Exportar Dados
    exportDataBtn.addEventListener('click', () => {
        if (chrome && chrome.storage && chrome.storage.local) {
            chrome.storage.local.get('myPromptsData', (result) => {
                if (result.myPromptsData) {
                    exportData(result.myPromptsData);
                } else {
                    showStatus('Nenhum dado de prompt para exportar.', 'warning');
                }
            });
        } else {
            // Fallback para localStorage
            const localData = localStorage.getItem('myPromptsData');
            if (localData) {
                exportData(JSON.parse(localData));
            } else {
                showStatus('Nenhum dado de prompt para exportar (localStorage).', 'warning');
            }
        }
    });

    function exportData(data) {
        const jsonData = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `meuprompt_backup_${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showStatus('Dados exportados com sucesso!', 'success');
    }

    // Importar Dados
    importDataBtn.addEventListener('click', () => {
        importFile.click(); // Aciona o input de arquivo oculto
    });

    importFile.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importedData = JSON.parse(e.target.result);
                    // Validação básica da estrutura dos dados importados
                    if (importedData && typeof importedData.prompts !== 'undefined' && typeof importedData.folders !== 'undefined') {
                        if (chrome && chrome.storage && chrome.storage.local) {
                            chrome.storage.local.set({ myPromptsData: importedData }, () => {
                                showStatus('Dados importados com sucesso! Recarregue a extensão para ver as mudanças.', 'success');
                                //  TODO: Adicionar uma forma de forçar a atualização do popup ou avisar melhor o usuário
                            });
                        } else {
                            localStorage.setItem('myPromptsData', JSON.stringify(importedData));
                            showStatus('Dados importados localmente! Recarregue a extensão para ver as mudanças.', 'success');
                        }
                    } else {
                        showStatus('Arquivo JSON inválido ou não contém os dados esperados.', 'error');
                    }
                } catch (error) {
                    showStatus(`Erro ao processar o arquivo JSON: ${error.message}`, 'error');
                } finally {
                    importFile.value = ''; // Reseta o input de arquivo
                }
            };
            reader.readAsText(file);
        }
    });


    function showStatus(message, type = 'info') {
        statusMessage.textContent = message;
        statusMessage.style.color = type === 'success' ? 'green' : (type === 'error' ? 'red' : 'orange');
        setTimeout(() => {
            statusMessage.textContent = '';
        }, 4000);
    }

    // Inicialização
    loadOptions();
});
