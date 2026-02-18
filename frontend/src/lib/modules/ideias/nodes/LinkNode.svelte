<script>
  import { Handle, Position, useSvelteFlow } from '@xyflow/svelte';
  import { writable } from 'svelte/store';
  
  export let id;
  export let data;
  export let selected = false;
  
  const { updateNodeData } = useSvelteFlow();
  
  let isEditing = false;
  let editTitle = data?.title || '';
  let editUrl = data?.url || '';
  let editDescription = data?.description || '';
  let isSaving = false;
  
  function startEditing() {
    isEditing = true;
    editTitle = data?.title || '';
    editUrl = data?.url || '';
    editDescription = data?.description || '';
  }
  
  function saveEdit() {
    isSaving = true;
    const newData = {
      ...data,
      title: editTitle,
      url: editUrl,
      description: editDescription
    };
    
    // Atualizar dados no SvelteFlow
    updateNodeData(id, newData);
    
    isEditing = false;
    isSaving = false;
  }
  
  function cancelEdit() {
    isEditing = false;
  }
  
  function openLink() {
    let url = data?.url || '';
    if (url && !url.startsWith('http')) {
      url = 'https://' + url;
    }
    window.open(url, '_blank');
  }
  
  function handleKeyDown(e) {
    if (e.key === 'Enter' && e.ctrlKey) {
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      // Prevenir delete do nó durante edição
      e.stopPropagation();
    }
  }
  
  $: displayUrl = (data?.url || '').replace(/^https?:\/\//, '').substring(0, 30) + ((data?.url || '').length > 30 ? '...' : '');
</script>

<div class="link-node" class:selected>
  <Handle type="target" position={Position.Top} id="top" />
  <Handle type="target" position={Position.Left} id="left" />
  
  <div class="node-header">
    {#if isEditing}
      <input
        type="text"
        bind:value={editTitle}
        placeholder="Título..."
        on:keydown={handleKeyDown}
        class="title-input"
      />
    {:else}
      <span class="node-title" on:dblclick={startEditing}>
        {data?.title || 'Sem título'}
      </span>
    {/if}
    <span class="node-icon">🔗</span>
  </div>
  
  <div class="node-content">
    {#if isEditing}
      <input
        type="text"
        bind:value={editUrl}
        placeholder="https://..."
        on:keydown={handleKeyDown}
        class="url-input"
      />
      <input
        type="text"
        bind:value={editDescription}
        placeholder="Descrição..."
        on:keydown={handleKeyDown}
        class="desc-input"
      />
      <div class="edit-actions">
        <button class="btn-save" on:click={saveEdit} disabled={isSaving}>
          {isSaving ? 'Salvando...' : 'Salvar'}
        </button>
        <button class="btn-cancel" on:click={cancelEdit}>Cancelar</button>
      </div>
    {:else}
      <div class="link-preview">
        <a href={data?.url || '#'} target="_blank" rel="noopener noreferrer" class="url-link" on:click|preventDefault={openLink}>
          <span class="link-icon">🔗</span>
          <span class="url-text">{displayUrl || 'Clique no título para editar'}</span>
        </a>
        {#if data?.description}
          <div class="link-description">{data.description}</div>
        {/if}
      </div>
    {/if}
  </div>
  
  <Handle type="source" position={Position.Bottom} id="bottom" />
  <Handle type="source" position={Position.Right} id="right" />
</div>

<style>
  .link-node {
    background: linear-gradient(135deg, #047857, #10b981);
    border-radius: 12px;
    padding: 16px;
    min-width: 220px;
    max-width: 300px;
    box-shadow: 0 4px 20px rgba(16, 185, 129, 0.3);
    border: 2px solid transparent;
    transition: all 0.2s ease;
  }
  
  .link-node.selected {
    border-color: #34d399;
    box-shadow: 0 4px 20px rgba(52, 211, 153, 0.5);
  }
  
  .node-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  }
  
  .node-title {
    font-weight: 600;
    font-size: 0.95rem;
    color: white;
    cursor: pointer;
  }
  
  .node-icon {
    font-size: 1.2rem;
  }
  
  .node-content {
    color: rgba(255, 255, 255, 0.9);
    font-size: 0.9rem;
  }
  
  .link-preview {
    cursor: pointer;
    padding: 8px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 6px;
  }
  
  .url-link {
    display: flex;
    align-items: center;
    gap: 8px;
    text-decoration: none;
    color: rgba(255, 255, 255, 0.9);
    word-break: break-all;
    font-size: 0.85rem;
  }
  
  .url-link:hover {
    color: white;
  }
  
  .link-icon {
    font-size: 1rem;
    flex-shrink: 0;
  }
  
  .url-text {
    font-family: monospace;
  }
  
  .link-description {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.7);
    margin-top: 8px;
  }
  
  .title-input, .url-input, .desc-input {
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: white;
    padding: 8px 10px;
    border-radius: 6px;
    font-size: 0.9rem;
    width: 100%;
    margin-bottom: 8px;
  }
  
  .title-input::placeholder,
  .url-input::placeholder,
  .desc-input::placeholder {
    color: rgba(255, 255, 255, 0.6);
  }
  
  .edit-actions {
    display: flex;
    gap: 8px;
    margin-top: 8px;
  }
  
  .btn-save, .btn-cancel {
    padding: 6px 12px;
    border: none;
    border-radius: 6px;
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .btn-save {
    background: #3b82f6;
    color: white;
  }
  
  .btn-save:hover {
    background: #2563eb;
  }
  
  .btn-save:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .btn-cancel {
    background: rgba(255, 255, 255, 0.2);
    color: white;
  }
  
  .btn-cancel:hover {
    background: rgba(255, 255, 255, 0.3);
  }
</style>
