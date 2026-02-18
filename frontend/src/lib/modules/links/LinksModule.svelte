<script lang="ts">
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import { 
    CarregarLinks, 
    SalvarLinks, 
    AdicionarLink, 
    DeletarLink,
    AtualizarLink,
    type Link 
  } from '$lib/services/links';
  import { ExternalLink, Trash2, Plus, Pencil, Check, X } from 'lucide-svelte';
  
  const links = writable<Link[]>([]);
  let newTitle = '';
  let newUrl = '';
  let newDescription = '';
  let isLoading = true;
  let autoSaveStatus = 'Pronto';
  let showAddForm = false;
  let editingLink: Link | null = null;
  
  onMount(async () => {
    const loaded = await CarregarLinks();
    links.set(loaded);
    isLoading = false;
  });
  
  async function addLink() {
    if (!newTitle.trim() || !newUrl.trim()) return;
    
    // Garantir que a URL tenha protocolo
    let url = newUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    const link: Link = {
      id: `link_${Date.now()}`,
      title: newTitle.trim(),
      url: url,
      description: newDescription.trim(),
      createdAt: new Date().toISOString()
    };
    
    await AdicionarLink(link);
    links.update(l => [...l, link]);
    
    // Limpar formulário
    newTitle = '';
    newUrl = '';
    newDescription = '';
    showAddForm = false;
  }
  
  async function deleteLink(id: string) {
    if (!confirm('Deseja remover este link?')) return;
    
    await DeletarLink(id);
    links.update(l => l.filter(link => link.id !== id));
  }
  
  function openLink(url: string) {
    window.open(url, '_blank');
  }
  
  function cancelAdd() {
    showAddForm = false;
    newTitle = '';
    newUrl = '';
    newDescription = '';
  }

  // Variáveis para edição
  let editTitle = '';
  let editUrl = '';
  let editDescription = '';

  function startEdit(link: Link) {
    editingLink = link;
    editTitle = link.title;
    editUrl = link.url;
    editDescription = link.description || '';
  }

  function cancelEdit() {
    editingLink = null;
    editTitle = '';
    editUrl = '';
    editDescription = '';
  }

  async function saveEdit() {
    if (!editingLink || !editTitle.trim() || !editUrl.trim()) return;

    // Garantir que a URL tenha protocolo
    let url = editUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    const updatedLink: Link = {
      ...editingLink,
      title: editTitle.trim(),
      url: url,
      description: editDescription.trim()
    };

    await AtualizarLink(updatedLink);
    links.update(l => l.map(link => link.id === updatedLink.id ? updatedLink : link));

    // Limpar edição
    editingLink = null;
    editTitle = '';
    editUrl = '';
    editDescription = '';
  }
  
  // Auto-save on changes
  let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;
  $: {
    if (!isLoading && $links) {
      autoSaveStatus = 'Salvando...';
      if (autoSaveTimer) clearTimeout(autoSaveTimer);
      autoSaveTimer = setTimeout(async () => {
        await SalvarLinks($links);
        autoSaveStatus = 'Salvo!';
        setTimeout(() => autoSaveStatus = 'Pronto', 2000);
      }, 1000);
    }
  }
</script>

<div class="links-module">
  <div class="module-header">
    <div class="header-title">
      <div class="header-icon">
        <ExternalLink size={28} />
      </div>
      <h1>Links Importantes</h1>
    </div>
    <div class="auto-save-indicator">
      <span class="pulse" class:saving={autoSaveStatus === 'Salvando...'}></span>
      <span>{autoSaveStatus}</span>
    </div>
  </div>
  
  <div class="links-container">
    <!-- Botão Adicionar -->
    {#if !showAddForm}
      <div class="btn-wrapper">
        <button class="btn-add" on:click={() => showAddForm = true}>
          <Plus size={20} />
          <span>Adicionar Link</span>
        </button>
      </div>
    {/if}
    
    <!-- Formulário de Adicionar -->
    {#if showAddForm}
      <div class="add-link-card">
        <h3>Novo Link</h3>
        <input 
          type="text" 
          bind:value={newTitle} 
          placeholder="Título do link..." 
          class="input-field"
        />
        <input 
          type="text" 
          bind:value={newUrl} 
          placeholder="www.exemplo.com" 
          class="input-field"
        />
        <input 
          type="text" 
          bind:value={newDescription} 
          placeholder="Descrição (opcional)..." 
          class="input-field"
        />
        <div class="form-actions">
          <button class="btn btn-secondary" on:click={cancelAdd}>
            Cancelar
          </button>
          <button 
            class="btn btn-primary" 
            on:click={addLink} 
            disabled={!newTitle.trim() || !newUrl.trim()}
          >
            Salvar Link
          </button>
        </div>
      </div>
    {/if}
    
    <!-- Lista de Links -->
    <div class="links-list">
      {#if $links.length === 0 && !showAddForm}
        <div class="empty-state">
          <div class="empty-icon">
            <ExternalLink size={64} />
          </div>
          <p class="empty-text">Nenhum link salvo ainda</p>
          <p class="empty-hint">Clique em "Adicionar Link" para começar!</p>
        </div>
      {:else}
        {#each $links as link (link.id)}
          {#if editingLink?.id === link.id}
            <!-- Modo de Edição -->
            <div class="link-card editing">
              <div class="edit-form">
                <input 
                  type="text" 
                  bind:value={editTitle} 
                  placeholder="Título do link..." 
                  class="input-field"
                />
                <input 
                  type="text" 
                  bind:value={editUrl} 
                  placeholder="www.exemplo.com" 
                  class="input-field"
                />
                <input 
                  type="text" 
                  bind:value={editDescription} 
                  placeholder="Descrição (opcional)..." 
                  class="input-field"
                />
                <div class="edit-actions">
                  <button 
                    class="btn-save-edit" 
                    on:click={saveEdit}
                    disabled={!editTitle.trim() || !editUrl.trim()}
                    title="Salvar alterações"
                  >
                    <Check size={16} />
                  </button>
                  <button 
                    class="btn-cancel-edit" 
                    on:click={cancelEdit}
                    title="Cancelar edição"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            </div>
          {:else}
            <!-- Modo de Visualização -->
            <div class="link-card">
              <div class="link-content">
                <h4 class="link-title">{link.title}</h4>
                <button 
                  class="link-url" 
                  on:click={() => openLink(link.url)}
                  title="Abrir link"
                >
                  <span>{link.url}</span>
                  <ExternalLink size={14} />
                </button>
                {#if link.description}
                  <p class="link-description">{link.description}</p>
                {/if}
              </div>
              <div class="card-actions">
                <button 
                  class="btn-edit" 
                  on:click={() => startEdit(link)} 
                  title="Editar link"
                >
                  <Pencil size={16} />
                </button>
                <button 
                  class="btn-delete" 
                  on:click={() => deleteLink(link.id)} 
                  title="Remover link"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          {/if}
        {/each}
      {/if}
    </div>
  </div>
</div>

<style>
  .links-module {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    background: var(--bg-primary);
  }
  
  .module-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 32px;
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border-color);
    flex-shrink: 0;
  }
  
  .header-title {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  
  .header-icon {
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, #1e40af, #3b82f6);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }
  
  .header-title h1 {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0;
    color: var(--text-primary);
  }
  
  .auto-save-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.85rem;
    color: var(--text-muted);
  }
  
  .pulse {
    width: 8px;
    height: 8px;
    background: #10b981;
    border-radius: 50%;
    animation: pulse 2s infinite;
  }
  
  .pulse.saving {
    background: #f59e0b;
    animation: pulse 0.5s infinite;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
  
  .links-container {
    flex: 1;
    overflow-y: auto;
    padding: 32px;
    max-width: 800px;
    margin: 0 auto;
    width: 100%;
  }
  
  .btn-wrapper {
    display: flex;
    justify-content: center;
    margin-bottom: 24px;
  }

  .btn-add {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    background: linear-gradient(135deg, #1e40af, #3b82f6);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 0.95rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .btn-add:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }
  
  .add-link-card {
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 24px;
  }
  
  .add-link-card h3 {
    margin: 0 0 16px 0;
    color: var(--text-primary);
    font-size: 1.1rem;
  }
  
  .input-field {
    width: 100%;
    padding: 12px 16px;
    margin-bottom: 12px;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    color: var(--text-primary);
    font-size: 0.95rem;
    box-sizing: border-box;
  }
  
  .input-field:focus {
    outline: none;
    border-color: #3b82f6;
  }
  
  .input-field::placeholder {
    color: var(--text-muted);
  }
  
  .form-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    margin-top: 8px;
  }
  
  .btn {
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .btn-primary {
    background: linear-gradient(135deg, #1e40af, #3b82f6);
    color: white;
  }
  
  .btn-primary:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }
  
  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .btn-secondary {
    background: transparent;
    color: var(--text-secondary);
    border: 1px solid var(--border-color);
  }
  
  .btn-secondary:hover {
    background: var(--bg-tertiary);
  }
  
  .links-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  .link-card {
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 20px 24px;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    transition: all 0.2s ease;
  }
  
  .link-card:hover {
    border-color: #3b82f6;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
  
  .link-content {
    flex: 1;
    min-width: 0;
  }
  
  .link-title {
    margin: 0 0 8px 0;
    color: var(--text-primary);
    font-size: 1.1rem;
    font-weight: 600;
  }
  
  .link-url {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: #3b82f6;
    text-decoration: none;
    font-size: 0.9rem;
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px 0;
    transition: color 0.2s;
  }
  
  .link-url:hover {
    color: #60a5fa;
    text-decoration: underline;
  }
  
  .link-url span {
    max-width: 500px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .link-description {
    margin: 8px 0 0 0;
    color: var(--text-secondary);
    font-size: 0.9rem;
  }
  
  .btn-delete {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #ef4444;
    cursor: pointer;
    padding: 8px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }
  
  .btn-delete:hover {
    background: rgba(239, 68, 68, 0.2);
    transform: scale(1.05);
  }

  .card-actions {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
  }

  .btn-edit {
    background: rgba(59, 130, 246, 0.1);
    border: 1px solid rgba(59, 130, 246, 0.3);
    color: #3b82f6;
    cursor: pointer;
    padding: 8px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  .btn-edit:hover {
    background: rgba(59, 130, 246, 0.2);
    transform: scale(1.05);
  }

  .link-card.editing {
    background: var(--bg-tertiary);
    border-color: #3b82f6;
  }

  .edit-form {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
  }

  .edit-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
    margin-top: 8px;
  }

  .btn-save-edit {
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.3);
    color: #10b981;
    cursor: pointer;
    padding: 8px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .btn-save-edit:hover:not(:disabled) {
    background: rgba(16, 185, 129, 0.2);
    transform: scale(1.05);
  }

  .btn-save-edit:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-cancel-edit {
    background: rgba(107, 114, 128, 0.1);
    border: 1px solid rgba(107, 114, 128, 0.3);
    color: #6b7280;
    cursor: pointer;
    padding: 8px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .btn-cancel-edit:hover {
    background: rgba(107, 114, 128, 0.2);
    transform: scale(1.05);
  }
  
  .empty-state {
    text-align: center;
    padding: 80px 20px;
    color: var(--text-muted);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 50vh;
  }
  
  .empty-icon {
    color: var(--text-muted);
    opacity: 0.5;
    margin-bottom: 24px;
  }
  
  .empty-text {
    font-size: 1.2rem;
    margin: 0 0 8px 0;
    color: var(--text-primary);
  }
  
  .empty-hint {
    font-size: 0.95rem;
    margin: 0;
    opacity: 0.7;
  }
</style>
