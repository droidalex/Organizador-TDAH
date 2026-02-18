<script lang="ts">
  import { Handle, Position, useSvelteFlow } from '@xyflow/svelte';
  import { writable } from 'svelte/store';
  import { UploadImagem, DeletarImagem } from '$lib/services/wails';
  
  export let id: string;
  export let data: any;
  export let selected = false;
  
  const { updateNodeData } = useSvelteFlow();
  
  let isEditing: boolean = false;
  let editTitle: string = data?.title || '';
  let showFullscreen: boolean = false;
  let isUploading: boolean = false;
  
  // Gerar URL da imagem (agora em assets/img/)
  $: imageUrl = data?.imageFile 
    ? `assets/img/${data.imageFile}` 
    : '';
  
  function startEditing() {
    isEditing = true;
    editTitle = data?.title || '';
  }
  
  function saveEdit() {
    const newData = {
      ...data,
      title: editTitle
    };
    
    updateNodeData(id, newData);
    isEditing = false;
    console.log('Título salvo:', editTitle);
  }
  
  function cancelEdit() {
    editTitle = data?.title || '';
    isEditing = false;
  }
  
  function handleBlur() {
    // Salvar automaticamente quando o input perde o foco
    saveEdit();
  }
  
  async function trocarImagem() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;
      
      isUploading = true;
      
      // Salvar referência da imagem anterior antes de fazer upload da nova
      const oldImageFile = data?.imageFile;
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        const arrayBuffer = e.target?.result as any;
        const bytes = new Uint8Array(arrayBuffer);
        
        try {
          // Fazer upload da nova imagem
          const filename = await UploadImagem(file.name, Array.from(bytes), id);
          
          // Se o upload for bem-sucedido, deletar a imagem anterior (se existir)
          if (oldImageFile && oldImageFile !== filename) {
            try {
              await DeletarImagem(oldImageFile);
              console.log('Imagem anterior deletada:', oldImageFile);
            } catch (deleteErr) {
              console.error('Erro ao deletar imagem anterior:', deleteErr);
              // Não interromper o processo, apenas logar o erro
            }
          }
          
          // Atualizar dados do nó com a nova imagem
          const newData = {
            ...data,
            title: file.name,
            imageFile: filename
          };
          
          updateNodeData(id, newData);
          console.log('Imagem trocada com sucesso. Nova imagem:', filename);
        } catch (err) {
          console.error('Erro ao fazer upload:', err);
          alert('Erro ao fazer upload da imagem');
        } finally {
          isUploading = false;
        }
      };
      reader.readAsArrayBuffer(file);
    };
    input.click();
  }
  
  function abrirFullscreen() {
    if (imageUrl) {
      showFullscreen = true;
    }
  }
  
  function fecharFullscreen() {
    showFullscreen = false;
  }
  
  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      // Prevenir delete do nó durante edição
      e.stopPropagation();
    }
  }
</script>

<div class="image-node" class:selected>
  <Handle type="target" position={Position.Top} id="top" />
  <Handle type="target" position={Position.Left} id="left" />
  
  <div class="node-header">
    {#if isEditing}
      <div class="edit-container">
        <input
          type="text"
          bind:value={editTitle}
          placeholder="Título..."
          on:keydown={handleKeyDown}
          on:blur={handleBlur}
          class="title-input"
          autofocus
        />
        <div class="edit-actions">
          <button class="btn-save" on:click={saveEdit} title="Salvar (Enter)">✓</button>
          <button class="btn-cancel" on:click={cancelEdit} title="Cancelar (Esc)">✕</button>
        </div>
      </div>
    {:else}
      <span class="node-title" on:dblclick={startEditing}>
        {data?.title || 'Sem título'}
      </span>
    {/if}
    <span class="node-icon">🖼️</span>
  </div>
  
  <div class="node-content">
    {#if imageUrl}
      <div class="image-container" on:click={abrirFullscreen}>
        <img 
          src={imageUrl} 
          alt={data?.title || 'Imagem'} 
          class="preview-image"
        />
        <div class="image-overlay">
          <span>🔍 Clique para ampliar</span>
        </div>
      </div>
    {:else}
      <div class="no-image" on:click={trocarImagem}>
        <span class="upload-icon">📤</span>
        <span>{isUploading ? 'Enviando...' : 'Clique para adicionar imagem'}</span>
      </div>
    {/if}
    
    {#if !isEditing}
      <button class="change-image-btn" on:click={trocarImagem} disabled={isUploading}>
        🔄 {isUploading ? 'Enviando...' : 'Trocar imagem'}
      </button>
    {/if}
  </div>
  
  <Handle type="source" position={Position.Bottom} id="bottom" />
  <Handle type="source" position={Position.Right} id="right" />
</div>

{#if showFullscreen}
  <div class="fullscreen-overlay" on:click={fecharFullscreen}>
    <button class="close-btn" on:click={fecharFullscreen}>✕</button>
    <img src={imageUrl} alt={data?.title} class="fullscreen-image" />
  </div>
{/if}

<style>
  .image-node {
    background: linear-gradient(135deg, #7c3aed, #8b5cf6);
    border-radius: 12px;
    padding: 16px;
    min-width: 240px;
    max-width: 300px;
    box-shadow: 0 4px 20px rgba(139, 92, 246, 0.3);
    border: 2px solid transparent;
    transition: all 0.2s ease;
  }
  
  .image-node.selected {
    border-color: #a78bfa;
    box-shadow: 0 4px 20px rgba(167, 139, 250, 0.5);
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
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  .image-container {
    position: relative;
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    min-height: 120px;
    background: rgba(0, 0, 0, 0.2);
  }
  
  .preview-image {
    width: 100%;
    height: 150px;
    object-fit: cover;
    display: block;
    transition: transform 0.2s ease;
  }
  
  .image-container:hover .preview-image {
    transform: scale(1.05);
  }
  
  .image-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
    padding: 20px 10px 10px;
    opacity: 0;
    transition: opacity 0.2s ease;
  }
  
  .image-container:hover .image-overlay {
    opacity: 1;
  }
  
  .image-overlay span {
    color: white;
    font-size: 0.8rem;
  }
  
  .no-image {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 30px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    color: rgba(255, 255, 255, 0.8);
  }
  
  .no-image:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  
  .upload-icon {
    font-size: 2rem;
    margin-bottom: 8px;
  }
  
  .change-image-btn {
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 6px;
    color: white;
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .change-image-btn:hover {
    background: rgba(255, 255, 255, 0.3);
  }
  
  .change-image-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .edit-container {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
  }

  .edit-actions {
    display: flex;
    gap: 8px;
  }

  .btn-save, .btn-cancel {
    padding: 4px 10px;
    border: none;
    border-radius: 4px;
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.2s ease;
    font-weight: 600;
  }

  .btn-save {
    background: #10b981;
    color: white;
  }

  .btn-save:hover {
    background: #059669;
  }

  .btn-cancel {
    background: rgba(255, 255, 255, 0.2);
    color: white;
  }

  .btn-cancel:hover {
    background: rgba(255, 255, 255, 0.3);
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
  }
  
  .title-input::placeholder {
    color: rgba(255, 255, 255, 0.6);
  }
  
  /* Fullscreen overlay */
  .fullscreen-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.95);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    cursor: zoom-out;
  }
  
  .fullscreen-image {
    max-width: 95vw;
    max-height: 95vh;
    object-fit: contain;
    border-radius: 8px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  }
  
  .close-btn {
    position: absolute;
    top: 20px;
    right: 20px;
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    font-size: 1.2rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .close-btn:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.1);
  }
</style>
