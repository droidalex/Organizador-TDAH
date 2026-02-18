<script lang="ts">
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import { 
    CarregarEventos, 
    SalvarEventos, 
    AdicionarEvento, 
    AtualizarEvento,
    DeletarEvento,
    CORES_EVENTO,
    type Evento 
  } from '$lib/services/calendario';
  import { Calendar, Plus, Clock, Trash2, Pencil, Check, X } from 'lucide-svelte';
  
  const eventos = writable<Evento[]>([]);
  let isLoading = true;
  let autoSaveStatus = 'Pronto';
  let showAddForm = false;
  let editingEvento: Evento | null = null;
  
  // Formulário
  let newTitulo = '';
  let newData = '';
  let newHora = '';
  let newDescricao = '';
  let newCor = CORES_EVENTO[0].cor;
  
  // Edição
  let editTitulo = '';
  let editData = '';
  let editHora = '';
  let editDescricao = '';
  let editCor = '';
  
  onMount(async () => {
    const loaded = await CarregarEventos();
    eventos.set(loaded);
    isLoading = false;
  });
  
  // Formatar data para exibição (DD/MM/YYYY)
  function formatarData(data: string): string {
    if (!data) return '';
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  }
  
  async function addEvento() {
    if (!newTitulo.trim() || !newData) return;
    
    const evento: Evento = {
      id: `evento_${Date.now()}`,
      titulo: newTitulo.trim(),
      data: newData,
      hora: newHora,
      descricao: newDescricao.trim(),
      cor: newCor,
      createdAt: new Date().toISOString()
    };
    
    await AdicionarEvento(evento);
    eventos.update(e => [...e, evento]);
    
    // Limpar formulário
    newTitulo = '';
    newData = '';
    newHora = '';
    newDescricao = '';
    newCor = CORES_EVENTO[0].cor;
    showAddForm = false;
  }
  
  async function deleteEvento(evento: Evento) {
    if (!confirm('Deseja remover este evento?')) return;
    
    await DeletarEvento(evento.id);
    eventos.update(e => e.filter(item => item.id !== evento.id));
  }
  
  function startEdit(evento: Evento) {
    editingEvento = evento;
    editTitulo = evento.titulo;
    editData = evento.data;
    editHora = evento.hora;
    editDescricao = evento.descricao;
    editCor = evento.cor;
  }
  
  function cancelEdit() {
    editingEvento = null;
    editTitulo = '';
    editData = '';
    editHora = '';
    editDescricao = '';
    editCor = '';
  }
  
  async function saveEdit() {
    if (!editingEvento || !editTitulo.trim() || !editData) return;
    
    const updatedEvento: Evento = {
      ...editingEvento,
      titulo: editTitulo.trim(),
      data: editData,
      hora: editHora,
      descricao: editDescricao.trim(),
      cor: editCor
    };
    
    await AtualizarEvento(updatedEvento);
    eventos.update(e => e.map(item => item.id === updatedEvento.id ? updatedEvento : item));
    
    editingEvento = null;
  }
  
  function cancelAdd() {
    showAddForm = false;
    newTitulo = '';
    newData = '';
    newHora = '';
    newDescricao = '';
    newCor = CORES_EVENTO[0].cor;
  }
  
  // Auto-save on changes
  let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;
  $: {
    if (!isLoading && $eventos) {
      autoSaveStatus = 'Salvando...';
      if (autoSaveTimer) clearTimeout(autoSaveTimer);
      autoSaveTimer = setTimeout(async () => {
        await SalvarEventos($eventos);
        autoSaveStatus = 'Salvo!';
        setTimeout(() => autoSaveStatus = 'Pronto', 2000);
      }, 1000);
    }
  }
</script>

<div class="calendario-module">
  <div class="module-header">
    <div class="header-title">
      <div class="header-icon">
        <Calendar size={28} />
      </div>
      <h1>Calendário de Eventos</h1>
    </div>
    <div class="auto-save-indicator">
      <span class="pulse" class:saving={autoSaveStatus === 'Salvando...'}></span>
      <span>{autoSaveStatus}</span>
    </div>
  </div>
  
  <div class="calendario-container">
    <!-- Botão Adicionar -->
    {#if !showAddForm}
      <div class="btn-wrapper">
        <button class="btn-add" on:click={() => showAddForm = true}>
          <Plus size={20} />
          <span>Adicionar Evento</span>
        </button>
      </div>
    {/if}
    
    <!-- Formulário de Adicionar -->
    {#if showAddForm}
      <div class="add-evento-card">
        <h3>Novo Evento</h3>
        <input 
          type="text" 
          bind:value={newTitulo} 
          placeholder="Título do evento..." 
          class="input-field"
        />
        <div class="form-row">
          <input 
            type="date" 
            bind:value={newData} 
            class="input-field"
          />
          <input 
            type="time" 
            bind:value={newHora} 
            class="input-field"
          />
        </div>
        <textarea 
          bind:value={newDescricao} 
          placeholder="Descrição (opcional)..." 
          class="textarea-field"
          rows="2"
        ></textarea>
        <div class="color-selector">
          <span>Cor:</span>
          <div class="color-options">
            {#each CORES_EVENTO as cor}
              <button 
                class="color-btn" 
                class:selected={newCor === cor.cor}
                style="background-color: {cor.cor}"
                on:click={() => newCor = cor.cor}
                title={cor.nome}
              ></button>
            {/each}
          </div>
        </div>
        <div class="form-actions">
          <button class="btn btn-secondary" on:click={cancelAdd}>
            Cancelar
          </button>
          <button 
            class="btn btn-primary" 
            on:click={addEvento}
            disabled={!newTitulo.trim() || !newData}
          >
            Adicionar
          </button>
        </div>
      </div>
    {/if}
    
    <!-- Lista de Eventos -->
    <div class="eventos-list">
      {#if $eventos.length === 0 && !showAddForm}
        <div class="empty-state">
          <div class="empty-icon">
            <Calendar size={64} />
          </div>
          <p class="empty-text">Nenhum evento adicionado ainda</p>
          <p class="empty-hint">Clique em "Adicionar Evento" para começar!</p>
        </div>
      {:else}
        {#each $eventos as evento (evento.id)}
          {#if editingEvento?.id === evento.id}
            <!-- Modo de Edição -->
            <div class="evento-card editing">
              <div class="edit-header" style="background-color: {editCor}">
                <input 
                  type="text" 
                  bind:value={editTitulo} 
                  placeholder="Título..." 
                  class="edit-title-input"
                />
              </div>
              <div class="edit-body">
                <div class="form-row">
                  <input 
                    type="date" 
                    bind:value={editData} 
                    class="input-field"
                  />
                  <input 
                    type="time" 
                    bind:value={editHora} 
                    class="input-field"
                  />
                </div>
                <textarea 
                  bind:value={editDescricao} 
                  placeholder="Descrição..." 
                  class="textarea-field"
                  rows="2"
                ></textarea>
                <div class="color-selector">
                  <span>Cor:</span>
                  <div class="color-options">
                    {#each CORES_EVENTO as cor}
                      <button 
                        class="color-btn" 
                        class:selected={editCor === cor.cor}
                        style="background-color: {cor.cor}"
                        on:click={() => editCor = cor.cor}
                        title={cor.nome}
                      ></button>
                    {/each}
                  </div>
                </div>
                <div class="edit-actions">
                  <button 
                    class="btn-save-edit" 
                    on:click={saveEdit}
                    disabled={!editTitulo.trim() || !editData}
                  >
                    <Check size={16} />
                  </button>
                  <button 
                    class="btn-cancel-edit" 
                    on:click={cancelEdit}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            </div>
          {:else}
            <!-- Modo de Visualização -->
            <div class="evento-card">
              <div class="evento-header" style="background-color: {evento.cor}">
                <h4 class="evento-titulo">{evento.titulo}</h4>
                <div class="header-actions">
                  <button 
                    class="btn-edit-header" 
                    on:click={() => startEdit(evento)}
                    title="Editar"
                  >
                    <Pencil size={14} />
                  </button>
                  <button 
                    class="btn-delete-header" 
                    on:click={() => deleteEvento(evento)}
                    title="Remover"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div class="evento-body">
                <div class="evento-info">
                  <span class="info-item">
                    <Calendar size={16} />
                    {formatarData(evento.data)}
                  </span>
                  {#if evento.hora}
                    <span class="info-item">
                      <Clock size={16} />
                      {evento.hora}
                    </span>
                  {/if}
                </div>
                {#if evento.descricao}
                  <p class="evento-descricao">{evento.descricao}</p>
                {/if}
              </div>
            </div>
          {/if}
        {/each}
      {/if}
    </div>
  </div>
</div>

<style>
  .calendario-module {
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
    background: linear-gradient(135deg, #ec4899, #f472b6);
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
  
  .calendario-container {
    flex: 1;
    overflow-y: auto;
    padding: 32px;
    max-width: 900px;
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
    background: linear-gradient(135deg, #ec4899, #f472b6);
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
    box-shadow: 0 4px 12px rgba(236, 72, 153, 0.3);
  }
  
  .add-evento-card {
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 24px;
  }
  
  .add-evento-card h3 {
    margin: 0 0 16px 0;
    color: var(--text-primary);
    font-size: 1.1rem;
  }
  
  .input-field,
  .textarea-field {
    width: 100%;
    padding: 12px 16px;
    margin-bottom: 12px;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    color: var(--text-primary);
    font-size: 0.95rem;
    font-family: inherit;
    box-sizing: border-box;
  }
  
  .input-field:focus,
  .textarea-field:focus {
    outline: none;
    border-color: #ec4899;
  }
  
  .textarea-field {
    resize: vertical;
    min-height: 60px;
  }
  
  .form-row {
    display: flex;
    gap: 12px;
  }
  
  .form-row .input-field {
    flex: 1;
  }
  
  .color-selector {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
  }
  
  .color-selector span {
    color: var(--text-secondary);
    font-size: 0.9rem;
  }
  
  .color-options {
    display: flex;
    gap: 8px;
  }
  
  .color-btn {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 2px solid transparent;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .color-btn:hover {
    transform: scale(1.1);
  }
  
  .color-btn.selected {
    border-color: white;
    box-shadow: 0 0 0 2px var(--bg-primary), 0 0 0 4px currentColor;
  }
  
  .form-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
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
    background: linear-gradient(135deg, #ec4899, #f472b6);
    color: white;
  }
  
  .btn-primary:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(236, 72, 153, 0.3);
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
  
  .eventos-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  .evento-card {
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.2s ease;
  }
  
  .evento-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    transform: translateY(-2px);
  }
  
  .evento-card.editing {
    border-color: #ec4899;
  }
  
  .evento-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    color: white;
  }
  
  .evento-titulo {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
  }
  
  .header-actions {
    display: flex;
    gap: 8px;
  }
  
  .header-actions button {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    padding: 6px;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }
  
  .header-actions button:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.05);
  }
  
  .evento-body {
    padding: 20px;
  }
  
  .evento-info {
    display: flex;
    gap: 20px;
    margin-bottom: 12px;
  }
  
  .info-item {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--text-secondary);
    font-size: 0.9rem;
  }
  
  .evento-descricao {
    margin: 0;
    color: var(--text-primary);
    font-size: 0.95rem;
    line-height: 1.5;
  }
  
  .edit-header {
    padding: 16px 20px;
  }
  
  .edit-title-input {
    width: 100%;
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: white;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 1rem;
    font-weight: 600;
  }
  
  .edit-title-input::placeholder {
    color: rgba(255, 255, 255, 0.6);
  }
  
  .edit-body {
    padding: 20px;
  }
  
  .edit-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
    margin-top: 12px;
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
