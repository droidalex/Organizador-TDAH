<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { writable } from 'svelte/store';
  import { 
    CarregarQuadro, 
    SalvarQuadro, 
    AdicionarTarefa, 
    MoverTarefa,
    DeletarTarefa,
    AtualizarTarefa,
    type Tarefa,
    type QuadroKanban
  } from '$lib/services/planejamento';
  import { Layout, Target, Settings, Check, Plus, ChevronLeft, ChevronRight, Trash2, Pencil, X } from 'lucide-svelte';
  
  const quadro = writable<QuadroKanban>({
    objetivo: [],
    fazendo: [],
    feito: []
  });
  
  let isLoading = true;
  let autoSaveStatus = 'Pronto';
  let showAddForm: 'objetivo' | 'fazendo' | 'feito' | null = null;
  let newTitulo = '';
  let newDescricao = '';
  
  // Estado para edição
  let editingTarefa: Tarefa | null = null;
  let editTitulo = '';
  let editDescricao = '';
  
  onMount(async () => {
    const loaded = await CarregarQuadro();
    quadro.set(loaded);
    isLoading = false;
  });
  
  async function addTarefa(status: 'objetivo' | 'fazendo' | 'feito') {
    if (!newTitulo.trim()) return;
    
    const tarefa: Tarefa = {
      id: `tarefa_${Date.now()}`,
      titulo: newTitulo.trim(),
      descricao: newDescricao.trim(),
      status: status,
      createdAt: new Date().toISOString()
    };
    
    await AdicionarTarefa(tarefa);
    quadro.update(q => {
      q[status].push(tarefa);
      return q;
    });
    
    // Limpar formulário
    newTitulo = '';
    newDescricao = '';
    showAddForm = null;
  }
  
  async function moverTarefa(tarefa: Tarefa, direcao: 'esquerda' | 'direita') {
    const statusOrder: ('objetivo' | 'fazendo' | 'feito')[] = ['objetivo', 'fazendo', 'feito'];
    const currentIndex = statusOrder.indexOf(tarefa.status);
    
    let novoStatus: 'objetivo' | 'fazendo' | 'feito';
    
    if (direcao === 'esquerda' && currentIndex > 0) {
      novoStatus = statusOrder[currentIndex - 1];
    } else if (direcao === 'direita' && currentIndex < statusOrder.length - 1) {
      novoStatus = statusOrder[currentIndex + 1];
    } else {
      return; // Não pode mover
    }
    
    await MoverTarefa(tarefa.id, tarefa.status, novoStatus);
    quadro.update(q => {
      // Remover da lista atual
      q[tarefa.status] = q[tarefa.status].filter((t: Tarefa) => t.id !== tarefa.id);
      // Adicionar à nova lista
      tarefa.status = novoStatus;
      q[novoStatus].push(tarefa);
      return q;
    });
  }
  
  async function deleteTarefa(tarefa: Tarefa) {
    if (!confirm('Deseja remover esta tarefa?')) return;
    
    await DeletarTarefa(tarefa.id, tarefa.status);
    quadro.update(q => {
      q[tarefa.status] = q[tarefa.status].filter((t: Tarefa) => t.id !== tarefa.id);
      return q;
    });
  }
  
  function startEdit(tarefa: Tarefa) {
    editingTarefa = tarefa;
    editTitulo = tarefa.titulo;
    editDescricao = tarefa.descricao;
  }
  
  function cancelEdit() {
    editingTarefa = null;
    editTitulo = '';
    editDescricao = '';
  }
  
  async function saveEdit() {
    if (!editingTarefa || !editTitulo.trim()) return;
    
    const updatedTarefa: Tarefa = {
      ...editingTarefa,
      titulo: editTitulo.trim(),
      descricao: editDescricao.trim()
    };
    
    await AtualizarTarefa(updatedTarefa, updatedTarefa.status);
    quadro.update(q => {
      const lista = q[updatedTarefa.status];
      const index = lista.findIndex((t: Tarefa) => t.id === updatedTarefa.id);
      if (index !== -1) {
        lista[index] = updatedTarefa;
      }
      return q;
    });
    
    editingTarefa = null;
    editTitulo = '';
    editDescricao = '';
  }
  
  function cancelAdd() {
    showAddForm = null;
    newTitulo = '';
    newDescricao = '';
  }
  
  // Auto-save on changes - usa uma variável para controlar mudanças
  let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;
  let lastSavedQuadro: string = '';
  
  // Observa mudanças no quadro e salva automaticamente
  const unsubscribe = quadro.subscribe((currentQuadro) => {
    if (!isLoading) {
      const currentJson = JSON.stringify(currentQuadro);
      
      // Só salva se houve mudança real
      if (currentJson !== lastSavedQuadro) {
        autoSaveStatus = 'Salvando...';
        if (autoSaveTimer) clearTimeout(autoSaveTimer);
        
        autoSaveTimer = setTimeout(async () => {
          await SalvarQuadro(currentQuadro);
          lastSavedQuadro = JSON.stringify(currentQuadro);
          autoSaveStatus = 'Salvo!';
          setTimeout(() => autoSaveStatus = 'Pronto', 2000);
        }, 1000);
      }
    }
  });
  
  // Cleanup subscription on destroy
  onDestroy(() => {
    unsubscribe();
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
  });
</script>

<div class="planejamento-module">
  <div class="module-header">
    <div class="header-title">
      <div class="header-icon">
        <Layout size={28} />
      </div>
      <h1>Planejamento Kanban</h1>
    </div>
    <div class="auto-save-indicator">
      <span class="pulse" class:saving={autoSaveStatus === 'Salvando...'}></span>
      <span>{autoSaveStatus}</span>
    </div>
  </div>
  
  <div class="kanban-container">
    <!-- Coluna OBJETIVO -->
    <div class="kanban-column">
      <div class="column-header objetivo">
        <Target size={18} />
        <span>OBJETIVO</span>
      </div>
      
      <div class="column-content">
        {#if $quadro?.objetivo}
        {#each $quadro.objetivo as tarefa (tarefa.id)}
          <div class="task-card">
            <h4 class="task-title">{tarefa.titulo}</h4>
            {#if tarefa.descricao}
              <p class="task-desc">{tarefa.descricao}</p>
            {/if}
            <div class="task-actions">
              <button 
                class="btn-nav" 
                on:click={() => moverTarefa(tarefa, 'direita')}
                title="Mover para Fazendo"
              >
                <ChevronRight size={16} />
              </button>
              <button 
                class="btn-edit" 
                on:click={() => startEdit(tarefa)}
                title="Editar"
              >
                <Pencil size={16} />
              </button>
              <button 
                class="btn-delete" 
                on:click={() => deleteTarefa(tarefa)}
                title="Remover"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        {/each}
        {/if}
        
        {#if showAddForm === 'objetivo'}
          <div class="add-task-form">
            <input 
              type="text" 
              bind:value={newTitulo} 
              placeholder="Título da tarefa..." 
              class="input-field"
            />
            <textarea 
              bind:value={newDescricao} 
              placeholder="Descrição (opcional)..." 
              class="textarea-field"
              rows="2"
            ></textarea>
            <div class="form-actions">
              <button class="btn btn-secondary" on:click={cancelAdd}>
                Cancelar
              </button>
              <button 
                class="btn btn-primary" 
                on:click={() => addTarefa('objetivo')}
                disabled={!newTitulo.trim()}
              >
                Adicionar
              </button>
            </div>
          </div>
        {/if}
      </div>
      
      <button class="btn-add-column" on:click={() => showAddForm = 'objetivo'}>
        <Plus size={16} />
        <span>Adicionar</span>
      </button>
    </div>
    
    <!-- Coluna FAZENDO -->
    <div class="kanban-column">
      <div class="column-header fazendo">
        <Settings size={18} />
        <span>FAZENDO</span>
      </div>
      
      <div class="column-content">
        {#if $quadro?.fazendo}
        {#each $quadro.fazendo as tarefa (tarefa.id)}
          <div class="task-card">
            <h4 class="task-title">{tarefa.titulo}</h4>
            {#if tarefa.descricao}
              <p class="task-desc">{tarefa.descricao}</p>
            {/if}
            <div class="task-actions">
              <button 
                class="btn-nav" 
                on:click={() => moverTarefa(tarefa, 'esquerda')}
                title="Mover para Objetivo"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                class="btn-nav" 
                on:click={() => moverTarefa(tarefa, 'direita')}
                title="Mover para Feito"
              >
                <ChevronRight size={16} />
              </button>
              <button 
                class="btn-edit" 
                on:click={() => startEdit(tarefa)}
                title="Editar"
              >
                <Pencil size={16} />
              </button>
              <button 
                class="btn-delete" 
                on:click={() => deleteTarefa(tarefa)}
                title="Remover"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        {/each}
        {/if}
        
        {#if showAddForm === 'fazendo'}
          <div class="add-task-form">
            <input 
              type="text" 
              bind:value={newTitulo} 
              placeholder="Título da tarefa..." 
              class="input-field"
            />
            <textarea 
              bind:value={newDescricao} 
              placeholder="Descrição (opcional)..." 
              class="textarea-field"
              rows="2"
            ></textarea>
            <div class="form-actions">
              <button class="btn btn-secondary" on:click={cancelAdd}>
                Cancelar
              </button>
              <button 
                class="btn btn-primary" 
                on:click={() => addTarefa('fazendo')}
                disabled={!newTitulo.trim()}
              >
                Adicionar
              </button>
            </div>
          </div>
        {/if}
      </div>
      
      <button class="btn-add-column" on:click={() => showAddForm = 'fazendo'}>
        <Plus size={16} />
        <span>Adicionar</span>
      </button>
    </div>
    
    <!-- Coluna FEITO -->
    <div class="kanban-column">
      <div class="column-header feito">
        <Check size={18} />
        <span>FEITO</span>
      </div>
      
      <div class="column-content">
        {#if $quadro?.feito}
        {#each $quadro.feito as tarefa (tarefa.id)}
          <div class="task-card">
            <h4 class="task-title">{tarefa.titulo}</h4>
            {#if tarefa.descricao}
              <p class="task-desc">{tarefa.descricao}</p>
            {/if}
            <div class="task-actions">
              <button 
                class="btn-nav" 
                on:click={() => moverTarefa(tarefa, 'esquerda')}
                title="Mover para Fazendo"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                class="btn-edit" 
                on:click={() => startEdit(tarefa)}
                title="Editar"
              >
                <Pencil size={16} />
              </button>
              <button 
                class="btn-delete" 
                on:click={() => deleteTarefa(tarefa)}
                title="Remover"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        {/each}
        {/if}
        
        {#if showAddForm === 'feito'}
          <div class="add-task-form">
            <input 
              type="text" 
              bind:value={newTitulo} 
              placeholder="Título da tarefa..." 
              class="input-field"
            />
            <textarea 
              bind:value={newDescricao} 
              placeholder="Descrição (opcional)..." 
              class="textarea-field"
              rows="2"
            ></textarea>
            <div class="form-actions">
              <button class="btn btn-secondary" on:click={cancelAdd}>
                Cancelar
              </button>
              <button 
                class="btn btn-primary" 
                on:click={() => addTarefa('feito')}
                disabled={!newTitulo.trim()}
              >
                Adicionar
              </button>
            </div>
          </div>
        {/if}
      </div>
      
      <button class="btn-add-column" on:click={() => showAddForm = 'feito'}>
        <Plus size={16} />
        <span>Adicionar</span>
      </button>
    </div>
  </div>

  <!-- Modal de Edição -->
  {#if editingTarefa}
    <div 
      class="modal-overlay" 
      on:click={cancelEdit}
      role="dialog"
      aria-modal="true"
      aria-label="Editar tarefa"
      tabindex="0"
      on:keydown={(e) => e.key === 'Escape' && cancelEdit()}
    >
      <div 
        class="modal-content" 
        on:click|stopPropagation
        role="document"
        on:keydown|stopPropagation
      >
        <h3>Editar Tarefa</h3>
        <input 
          type="text" 
          bind:value={editTitulo} 
          placeholder="Título da tarefa..." 
          class="input-field"
        />
        <textarea 
          bind:value={editDescricao} 
          placeholder="Descrição (opcional)..." 
          class="textarea-field"
          rows="3"
        ></textarea>
        <div class="form-actions">
          <button class="btn btn-secondary" on:click={cancelEdit}>
            Cancelar
          </button>
          <button 
            class="btn btn-primary" 
            on:click={saveEdit}
            disabled={!editTitulo.trim()}
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  {/if}

</div>

<style>
  .planejamento-module {
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
    background: linear-gradient(135deg, #f59e0b, #f97316);
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
  
  .kanban-container {
    flex: 1;
    display: flex;
    gap: 24px;
    padding: 32px;
    overflow-x: auto;
    overflow-y: hidden;
  }
  
  .kanban-column {
    flex: 1;
    min-width: 300px;
    max-width: 400px;
    background: var(--bg-secondary);
    border-radius: 12px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    border: 1px solid var(--border-color);
  }
  
  .column-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 16px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.9rem;
    margin-bottom: 16px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .column-header.objetivo {
    background: linear-gradient(135deg, #f59e0b, #f97316);
    color: white;
  }
  
  .column-header.fazendo {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
  }
  
  .column-header.feito {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
  }
  
  .column-content {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 16px;
  }
  
  .task-card {
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 16px;
    transition: all 0.2s ease;
  }
  
  .task-card:hover {
    border-color: #3b82f6;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }
  
  .task-title {
    margin: 0 0 8px 0;
    color: var(--text-primary);
    font-size: 1rem;
    font-weight: 600;
  }
  
  .task-desc {
    margin: 0 0 12px 0;
    color: var(--text-secondary);
    font-size: 0.85rem;
    line-height: 1.4;
  }
  
  .task-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }
  
  .btn-nav {
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    color: var(--text-secondary);
    cursor: pointer;
    padding: 6px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }
  
  .btn-nav:hover {
    background: var(--bg-tertiary);
    border-color: #3b82f6;
    color: var(--text-primary);
  }
  
  .btn-edit {
    background: rgba(59, 130, 246, 0.1);
    border: 1px solid rgba(59, 130, 246, 0.3);
    color: #3b82f6;
    cursor: pointer;
    padding: 6px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }
  
  .btn-edit:hover {
    background: rgba(59, 130, 246, 0.2);
  }
  
  .btn-delete {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #ef4444;
    cursor: pointer;
    padding: 6px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }
  
  .btn-delete:hover {
    background: rgba(239, 68, 68, 0.2);
  }
  
  .add-task-form {
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .input-field,
  .textarea-field {
    width: 100%;
    padding: 10px 12px;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    color: var(--text-primary);
    font-size: 0.9rem;
    font-family: inherit;
    box-sizing: border-box;
  }
  
  .input-field:focus,
  .textarea-field:focus {
    outline: none;
    border-color: #3b82f6;
  }
  
  .textarea-field {
    resize: vertical;
    min-height: 60px;
  }
  
  .form-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }
  
  .btn {
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    font-size: 0.85rem;
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
    background: var(--bg-secondary);
  }
  
  .btn-add-column {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px;
    background: transparent;
    border: 2px dashed var(--border-color);
    border-radius: 8px;
    color: var(--text-muted);
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-top: auto;
  }
  
  .btn-add-column:hover {
    border-color: #3b82f6;
    color: #3b82f6;
    background: rgba(59, 130, 246, 0.1);
  }
  
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  
  .modal-content {
    background: var(--bg-secondary);
    border-radius: 12px;
    padding: 24px;
    width: 90%;
    max-width: 500px;
    border: 1px solid var(--border-color);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  }
  
  .modal-content h3 {
    margin: 0 0 16px 0;
    color: var(--text-primary);
    font-size: 1.25rem;
  }
</style>
