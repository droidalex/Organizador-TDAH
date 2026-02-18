<script>
  import { Handle, Position, useSvelteFlow, NodeResizer } from '@xyflow/svelte';
  
  export let id;
  export let data;
  export let selected = false;
  export let width = 400;
  export let height = 300;
  
  const { updateNodeData, updateNode } = useSvelteFlow();
  
  // Dimensões mínimas do grupo
  const minWidth = 200;
  const minHeight = 150;
  
  let isEditing = false;
  let editTitle = data?.title || '';
  let editColor = data?.color || 'rgba(59, 130, 246, 0.1)';
  
  const coresDisponiveis = [
    { cor: 'rgba(59, 130, 246, 0.1)', nome: 'Azul' },
    { cor: 'rgba(16, 185, 129, 0.1)', nome: 'Verde' },
    { cor: 'rgba(139, 92, 246, 0.1)', nome: 'Roxo' },
    { cor: 'rgba(245, 158, 11, 0.1)', nome: 'Laranja' },
    { cor: 'rgba(239, 68, 68, 0.1)', nome: 'Vermelho' },
    { cor: 'rgba(6, 182, 212, 0.1)', nome: 'Ciano' },
    { cor: 'rgba(236, 72, 153, 0.1)', nome: 'Rosa' },
    { cor: 'rgba(100, 116, 139, 0.1)', nome: 'Cinza' }
  ];
  
  function startEditing() {
    isEditing = true;
    editTitle = data?.title || '';
    editColor = data?.color || 'rgba(59, 130, 246, 0.1)';
  }
  
  function saveEdit() {
    const newData = {
      ...data,
      title: editTitle,
      color: editColor
    };
    
    // Atualizar dados no SvelteFlow
    updateNodeData(id, newData);
    
    // Atualizar o estilo do nó
    updateNode(id, {
      style: {
        width,
        height,
        backgroundColor: editColor,
        border: `2px dashed ${getBorderColor(editColor)}`,
        borderRadius: '12px'
      }
    });
    
    isEditing = false;
  }
  
  function cancelEdit() {
    isEditing = false;
  }
  
  function getBorderColor(bgColor) {
    // Extrair a cor base do rgba
    const match = bgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      return `rgb(${match[1]}, ${match[2]}, ${match[3]})`;
    }
    return '#3b82f6';
  }
  
  function selecionarCor(cor) {
    editColor = cor;
  }
  
  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      // Prevenir delete do nó durante edição
      e.stopPropagation();
    }
  }
  
  $: borderColor = getBorderColor(data?.color || 'rgba(59, 130, 246, 0.1)');
</script>

<NodeResizer 
  minWidth={minWidth} 
  minHeight={minHeight} 
  isVisible={selected}
  lineClass="resize-line"
  handleClass="resize-handle"
/>

<div 
  class="group-node" 
  class:selected
  style="background-color: {data?.color || 'rgba(59, 130, 246, 0.1)'}; border-color: {borderColor}"
>
  <Handle type="target" position={Position.Top} id="top" />
  <Handle type="target" position={Position.Left} id="left" />
  
  <div class="group-header">
    {#if isEditing}
      <div class="edit-form">
        <input
          type="text"
          bind:value={editTitle}
          placeholder="Título do grupo..."
          class="title-input"
          on:keydown={handleKeyDown}
        />
        <div class="color-picker">
          {#each coresDisponiveis as corItem}
            <button
              class="color-option"
              class:selected={editColor === corItem.cor}
              style="background-color: {corItem.cor}; border-color: {getBorderColor(corItem.cor)}"
              title={corItem.nome}
              on:click={() => selecionarCor(corItem.cor)}
            />
          {/each}
        </div>
        <div class="edit-actions">
          <button class="btn-save" on:click={saveEdit}>Salvar</button>
          <button class="btn-cancel" on:click={cancelEdit}>Cancelar</button>
        </div>
      </div>
    {:else}
      <span class="group-title" on:dblclick={startEditing}>
        {data?.title || 'Grupo'}
      </span>
      <span class="group-icon">📁</span>
    {/if}
  </div>
  
  <div class="group-content">
    <!-- Nós filhos serão renderizados aqui pelo SvelteFlow -->
  </div>
  
  <Handle type="source" position={Position.Bottom} id="bottom" />
  <Handle type="source" position={Position.Right} id="right" />
</div>

<style>
  .group-node {
    width: 100%;
    height: 100%;
    border: 2px dashed;
    border-radius: 12px;
    padding: 16px;
    position: relative;
    transition: all 0.2s ease;
  }
  
  .group-node.selected {
    border-style: solid;
    border-width: 3px;
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
  }
  
  .group-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
  }
  
  .group-title {
    font-weight: 600;
    font-size: 1rem;
    color: var(--text-primary);
    cursor: pointer;
  }
  
  .group-icon {
    font-size: 1.2rem;
  }
  
  .group-content {
    min-height: 200px;
  }
  
  .edit-form {
    width: 100%;
  }
  
  .title-input {
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: var(--text-primary);
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 1rem;
    font-weight: 600;
    width: 100%;
    margin-bottom: 12px;
  }
  
  .color-picker {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 12px;
  }
  
  .color-option {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 2px solid;
    cursor: pointer;
    transition: transform 0.2s ease;
  }
  
  .color-option:hover {
    transform: scale(1.1);
  }
  
  .color-option.selected {
    box-shadow: 0 0 0 3px white, 0 0 0 5px var(--accent-primary);
  }
  
  .edit-actions {
    display: flex;
    gap: 8px;
  }
  
  .btn-save, .btn-cancel {
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .btn-save {
    background: var(--accent-success);
    color: white;
  }
  
  .btn-save:hover {
    background: #059669;
  }
  
  .btn-cancel {
    background: rgba(255, 255, 255, 0.2);
    color: var(--text-primary);
  }
  
  .btn-cancel:hover {
    background: rgba(255, 255, 255, 0.3);
  }
  
  :global(.resize-line) {
    border-color: #3b82f6 !important;
  }
  
  :global(.resize-handle) {
    background-color: #3b82f6 !important;
    border-color: white !important;
    width: 10px !important;
    height: 10px !important;
  }
  
  :global(.resize-handle:hover) {
    background-color: #60a5fa !important;
  }
</style>
