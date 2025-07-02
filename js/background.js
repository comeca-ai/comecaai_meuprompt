// background.js

// Evento de instalação da extensão
chrome.runtime.onInstalled.addListener(() => {
  console.log("MeuPrompt Extensão Instalada.");

  // Aqui você pode definir valores iniciais no chrome.storage se necessário
  // Exemplo:
  // chrome.storage.local.get('myPromptsData', (result) => {
  //   if (!result.myPromptsData) {
  //     chrome.storage.local.set({
  //       myPromptsData: {
  //         prompts: [],
  //         folders: [],
  //         nextPromptId: 1,
  //         nextFolderId: 1,
  //       }
  //     });
  //   }
  // });

  // Criar um menu de contexto (clique direito) - Exemplo
  chrome.contextMenus.create({
    id: "meuPromptSaveSelection",
    title: "Salvar seleção como Novo Prompt",
    contexts: ["selection"]
  });
});

// Ouvinte para o menu de contexto
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "meuPromptSaveSelection" && info.selectionText) {
    // Abrir o popup (ou uma página específica da extensão) para adicionar o prompt
    // Isso é um pouco complexo porque popups não podem ser abertos programaticamente de forma direta
    // Uma abordagem é abrir uma nova aba com uma URL da extensão ou enviar uma mensagem para o popup se estiver aberto.

    // Abordagem simples: Salvar diretamente no storage e o usuário verá ao abrir o popup
    chrome.storage.local.get('myPromptsData', (result) => {
      let appData = result.myPromptsData;
      if (!appData || !appData.prompts) {
        appData = { prompts: [], folders: [], nextPromptId: 1, nextFolderId: 1 };
      }

      const newPrompt = {
        id: `p${appData.nextPromptId++}`,
        title: `Seleção de ${tab.title || 'página da web'}`, // Título simples
        content: info.selectionText,
        folderId: null,
        createdAt: new Date().toISOString()
      };
      appData.prompts.push(newPrompt);

      chrome.storage.local.set({ myPromptsData: appData }, () => {
        console.log("Seleção salva como novo prompt.");
        // Opcional: Enviar uma notificação para o usuário
        chrome.notifications.create({
          type: 'basic',
          iconUrl: '../icons/icon48.png',
          title: 'MeuPrompt',
          message: 'Texto selecionado salvo como um novo prompt!'
        });
      });
    });
  }
});

// Outras lógicas de background, como:
// - Sincronização periódica (se houver um backend)
// - Gerenciamento de notificações
// - Listener para mensagens de content scripts ou popup (chrome.runtime.onMessage.addListener)

console.log("Background script carregado.");
