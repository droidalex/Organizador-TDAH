<script>
  import { Handle, Position, useSvelteFlow } from '@xyflow/svelte';
  import { writable } from 'svelte/store';
  
  export let id;
  export let data;
  export let selected = false;
  
  const { updateNodeData } = useSvelteFlow();
  
  let isEditing = false;
  let editTitle = data?.title || '';
  let editContent = data?.content || '';
  let isSaving = false;
  
  function startEditing() {
    isEditing = true;
    editTitle = data?.title || '';
    editContent = data?.content || '';
  }
  
  function saveEdit() {
    isSaving = true;
    const newData = {
      ...data,
      title: editTitle,
      content: editContent
    };
    
    // Atualizar dados no SvelteFlow
    updateNodeData(id, newData);
    
    isEditing = false;
    isSaving = false;
  }
  
  function cancelEdit() {
    isEditing = false;
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
</script>

<div class="text-node" class:selected>
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
    <span class="node-icon">📝</span>
  </div>
  
  <div class="node-content">
    {#if isEditing}
      <textarea
        bind:value={editContent}
        placeholder="Conteúdo..."
        on:keydown={handleKeyDown}
        class="content-input"
        rows="4"
      />
      <div class="edit-actions">
        <button class="btn-save" on:click={saveEdit} disabled={isSaving}>
          {isSaving ? 'Salvando...' : 'Salvar'}
        </button>
        <button class="btn-cancel" on:click={cancelEdit}>Cancelar</button>
      </div>
    {:else}
      <p on:dblclick={startEditing}>
        {data?.content || 'Clique duplo para editar...'}
      </p>
    {/if}
  </div>
  
  <Handle type="source" position={Position.Bottom} id="bottom" />
  <Handle type="source" position={Position.Right} id="right" />
</div>

<style>
  .text-node {
    background: linear-gradient(135deg, #1e40af, #3b82f6);
    border-radius: 12px;
    padding: 16px;
    min-width: 220px;
    max-width: 320px;
    box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);
    border: 2px solid transparent;
    transition: all 0.2s ease;
  }
  
  .text-node.selected {
    border-color: #60a5fa;
    box-shadow: 0 4px 20px rgba(96, 165, 250, 0.5);
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
    line-height: 1.5;
  }
  
  .node-content p {
    margin: 0;
    cursor: pointer;
    word-wrap: break-word;
  }
  
  .title-input {
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: white;
    padding: 6px 10px;
    border-radius: 6px;
    font-size: 0.95rem;
    font-weight: 600;
    width: 100%;
    margin-right: 8px;
  }
  
  .title-input::placeholder {
    color: rgba(255, 255, 255, 0.6);
  }
  
  .content-input {
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: white;
    padding: 10px;
    border-radius: 6px;
    font-size: 0.9rem;
    width: 100%;
    resize: vertical;
    min-height: 80px;
  }
  
  .content-input::placeholder {
    color: rgba(255, 255, 255, 0.6);
  }
  
  .edit-actions {
    display: flex;
    gap: 8px;
    margin-top: 10px;
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
    background: #10b981;
    color: white;
  }
  
  .btn-save:hover {
    background: #059669;
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
