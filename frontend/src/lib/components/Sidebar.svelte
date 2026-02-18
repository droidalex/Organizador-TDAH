<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Lightbulb, DatabaseBackup, Plus, RotateCcw, X, Check } from 'lucide-svelte';
  import { criarBackup, listarBackups, restaurarBackup, type BackupInfo } from '../services/backup';

  export let moduloAtivo = 'ideias';

  const dispatch = createEventDispatcher();

  const modulos = [
    { id: 'ideias', nome: 'IDEIAS/NOTAS', icone: '💡', descricao: 'Canvas para organizar ideias visualmente' },
    { id: 'links', nome: 'LINKS', icone: '🔗', descricao: 'Gerencie seus links favoritos' },
    { id: 'planejamento', nome: 'PLANEJAMENTO', icone: '📊', descricao: 'Planeje suas atividades e projetos' },
    { id: 'objetivo-passos', nome: 'OBJETIVO - PASSOS', icone: '📋', descricao: 'Defina objetivos e acompanhe passos' },
    { id: 'calendario', nome: 'CALENDÁRIO', icone: '📅', descricao: 'Visualize seus compromissos' },
    { id: 'objetivos', nome: 'OBJETIVOS', icone: '🎯', descricao: 'Acompanhe suas metas e objetivos' }
  ];

  function selecionarModulo(id: string) {
    dispatch('selecionar', id);
  }

  // Dica dinâmica baseada no módulo ativo
  $: dicaText = getDicaPorModulo(moduloAtivo);

  function getDicaPorModulo(modulo: string): string {
    const dicas: Record<string, string> = {
      'ideias': 'Use o Canvas de Ideias para mapear pensamentos visualmente. Conexões ajudam na memória!',
      'links': 'Organize seus links favoritos em um só lugar. Acesso rápido aos sites mais importantes!',
      'planejamento': 'Divida projetos grandes em etapas menores. O segredo é começar pelo primeiro passo!',
      'objetivo-passos': 'Defina objetivos claros e trace passos concretos. Cada pequena vitória conta!',
      'calendario': 'Visualize sua semana de forma clara. Use cores para diferenciar tipos de compromissos!',
      'objetivos': 'Estabeleça metas SMART: Específicas, Mensuráveis, Alcançáveis, Relevantes e com Prazo!'
    };
    return dicas[modulo] || 'Escolha um módulo e organize sua vida de forma visual e eficiente!';
  }

  // ── Backup ──────────────────────────────────────────────
  let showModal = false;
  let backups: BackupInfo[] = [];
  let carregando = false;
  let fazendoBackup = false;
  let restaurando: string | null = null;
  let mensagem: { tipo: 'ok' | 'erro'; texto: string } | null = null;

  async function abrirModal() {
    showModal = true;
    mensagem = null;
    carregando = true;
    try {
      backups = await listarBackups();
    } catch {
      backups = [];
    } finally {
      carregando = false;
    }
  }

  function fecharModal() {
    showModal = false;
    mensagem = null;
  }

  async function fazerBackupAgora() {
    fazendoBackup = true;
    mensagem = null;
    try {
      const info = await criarBackup();
      backups = [info, ...backups].slice(0, 10);
      mensagem = { tipo: 'ok', texto: `Backup criado: ${info.label}` };
    } catch (e: any) {
      mensagem = { tipo: 'erro', texto: e?.message ?? 'Erro ao criar backup.' };
    } finally {
      fazendoBackup = false;
    }
  }

  async function restaurar(nome: string) {
    if (!confirm(`Restaurar o backup de "${nome.replace('backup_', '')}"?\n\nOs dados atuais serão substituídos. O app precisará ser reiniciado.`)) return;
    restaurando = nome;
    mensagem = null;
    try {
      await restaurarBackup(nome);
      mensagem = { tipo: 'ok', texto: 'Dados restaurados! Reinicie o app para aplicar.' };
    } catch (e: any) {
      mensagem = { tipo: 'erro', texto: e?.message ?? 'Erro ao restaurar backup.' };
    } finally {
      restaurando = null;
    }
  }
</script>

<aside class="sidebar">
  <div class="sidebar-header">
    <div class="logo">
      <span class="logo-icon">🧠</span>
      <div class="logo-text">
        <h2>Organizador TDAH</h2>
        <span>Seu assistente de organização visual</span>
      </div>
    </div>
  </div>

  <nav class="modulos-nav">
    {#each modulos as modulo}
      <button
        class="modulo-btn"
        class:active={moduloAtivo === modulo.id}
        on:click={() => selecionarModulo(modulo.id)}
        title={modulo.descricao}
      >
        <span class="modulo-icon">{modulo.icone}</span>
        <span class="modulo-nome">{modulo.nome}</span>
        {#if moduloAtivo === modulo.id}
          <span class="active-indicator"></span>
        {/if}
      </button>
    {/each}
  </nav>

  <div class="sidebar-footer">
    <!-- Backup -->
    <button class="btn-backup" on:click={abrirModal} title="Gerenciar backups dos dados">
      <DatabaseBackup size={15} />
      <span>Backup de Dados</span>
    </button>

    <!-- Dica TDAH -->
    <div class="dica-box">
      <div class="dica-title">
        <Lightbulb size={16} />
        <span>Dica TDAH</span>
      </div>
      <p>{dicaText}</p>
    </div>
  </div>
</aside>

<!-- Modal de Backup -->
{#if showModal}
  <div
    class="modal-overlay"
    role="dialog"
    aria-modal="true"
    aria-label="Backup de dados"
    tabindex="0"
    on:click={fecharModal}
    on:keydown={(e) => e.key === 'Escape' && fecharModal()}
  >
    <div
      class="modal-content"
      role="document"
      on:click|stopPropagation
      on:keydown|stopPropagation
    >
      <!-- Cabeçalho -->
      <div class="modal-header">
        <div class="modal-title">
          <DatabaseBackup size={20} />
          <h3>Backup de Dados</h3>
        </div>
        <button class="btn-close" on:click={fecharModal} title="Fechar">
          <X size={18} />
        </button>
      </div>

      <!-- Mensagem de feedback -->
      {#if mensagem}
        <div class="feedback" class:feedback-ok={mensagem.tipo === 'ok'} class:feedback-erro={mensagem.tipo === 'erro'}>
          {#if mensagem.tipo === 'ok'}<Check size={14} />{/if}
          <span>{mensagem.texto}</span>
        </div>
      {/if}

      <!-- Botão backup manual -->
      <button
        class="btn-criar-backup"
        on:click={fazerBackupAgora}
        disabled={fazendoBackup}
      >
        <Plus size={16} />
        {fazendoBackup ? 'Criando backup...' : 'Fazer Backup Agora'}
      </button>

      <p class="info-auto">💡 Um backup automático é criado toda vez que o app é iniciado.</p>

      <!-- Lista de backups -->
      <div class="lista-header">
        <span>Backups disponíveis</span>
        <span class="lista-count">{backups.length}/10</span>
      </div>

      <div class="lista-backups">
        {#if carregando}
          <p class="lista-vazia">Carregando...</p>
        {:else if backups.length === 0}
          <p class="lista-vazia">Nenhum backup encontrado.</p>
        {:else}
          {#each backups as backup, i (backup.nome)}
            <div class="backup-item">
              <div class="backup-info">
                <span class="backup-label">{backup.label}</span>
                {#if i === 0}
                  <span class="badge-recente">mais recente</span>
                {/if}
              </div>
              <button
                class="btn-restaurar"
                on:click={() => restaurar(backup.nome)}
                disabled={restaurando === backup.nome}
                title="Restaurar este backup"
              >
                <RotateCcw size={13} />
                {restaurando === backup.nome ? '...' : 'Restaurar'}
              </button>
            </div>
          {/each}
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .sidebar {
    width: 280px;
    background: var(--bg-secondary);
    border-right: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    padding: 20px;
  }

  .sidebar-header {
    margin-bottom: 24px;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .logo-icon {
    font-size: 2rem;
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .logo-text { flex: 1; }

  .logo-text h2 {
    font-size: 1rem;
    font-weight: 600;
    margin: 0;
    color: var(--text-primary);
  }

  .logo-text span {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .modulos-nav {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .modulo-btn {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    background: transparent;
    border: none;
    border-radius: 10px;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    text-align: left;
  }

  .modulo-btn:hover {
    background: var(--bg-tertiary);
    color: var(--text-primary);
  }

  .modulo-btn.active {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2));
    color: var(--text-primary);
  }

  .modulo-icon {
    font-size: 1.25rem;
    width: 24px;
    text-align: center;
  }

  .modulo-nome {
    font-size: 0.85rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .active-indicator {
    position: absolute;
    right: 12px;
    width: 8px;
    height: 8px;
    background: var(--accent-primary);
    border-radius: 50%;
    box-shadow: 0 0 8px var(--accent-primary);
  }

  /* Footer */
  .sidebar-footer {
    margin-top: auto;
    padding-top: 16px;
    border-top: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  /* Botão Backup */
  .btn-backup {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 9px 12px;
    background: rgba(59, 130, 246, 0.08);
    border: 1px solid rgba(59, 130, 246, 0.2);
    border-radius: 8px;
    color: var(--text-muted);
    font-size: 0.8rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
  }

  .btn-backup:hover {
    background: rgba(59, 130, 246, 0.15);
    border-color: rgba(59, 130, 246, 0.4);
    color: var(--text-secondary);
  }

  /* Dica */
  .dica-box {
    background: var(--bg-tertiary);
    border-radius: 10px;
    padding: 16px;
  }

  .dica-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    font-weight: 600;
    color: var(--accent-warning);
    font-size: 0.85rem;
  }

  .dica-box p {
    font-size: 0.8rem;
    color: var(--text-secondary);
    line-height: 1.5;
    margin: 0;
  }

  /* ── Modal ─────────────────────────────────── */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.55);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
  }

  .modal-content {
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 14px;
    padding: 24px;
    width: 420px;
    max-width: 95vw;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    gap: 14px;
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4);
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .modal-title {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--text-primary);
  }

  .modal-title h3 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
  }

  .btn-close {
    background: transparent;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 4px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    transition: all 0.2s;
  }

  .btn-close:hover {
    background: var(--bg-tertiary);
    color: var(--text-primary);
  }

  /* Feedback */
  .feedback {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 500;
  }

  .feedback-ok {
    background: rgba(16, 185, 129, 0.12);
    border: 1px solid rgba(16, 185, 129, 0.3);
    color: #10b981;
  }

  .feedback-erro {
    background: rgba(239, 68, 68, 0.12);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #ef4444;
  }

  /* Botão criar backup */
  .btn-criar-backup {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 11px;
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    border: none;
    border-radius: 8px;
    color: white;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-criar-backup:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
  }

  .btn-criar-backup:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .info-auto {
    font-size: 0.78rem;
    color: var(--text-muted);
    margin: -4px 0 0 0;
    line-height: 1.4;
  }

  /* Lista */
  .lista-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.82rem;
    color: var(--text-muted);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.4px;
  }

  .lista-count {
    background: var(--bg-tertiary);
    padding: 2px 8px;
    border-radius: 99px;
    font-size: 0.75rem;
  }

  .lista-backups {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 6px;
    max-height: 260px;
  }

  .lista-vazia {
    text-align: center;
    color: var(--text-muted);
    font-size: 0.85rem;
    padding: 20px 0;
    margin: 0;
  }

  .backup-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 10px 12px;
    background: var(--bg-tertiary);
    border-radius: 8px;
    border: 1px solid transparent;
    transition: border-color 0.2s;
  }

  .backup-item:hover {
    border-color: var(--border-color);
  }

  .backup-info {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 0;
  }

  .backup-label {
    font-size: 0.82rem;
    color: var(--text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .badge-recente {
    font-size: 0.68rem;
    background: rgba(16, 185, 129, 0.15);
    color: #10b981;
    border: 1px solid rgba(16, 185, 129, 0.3);
    padding: 1px 6px;
    border-radius: 99px;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .btn-restaurar {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 5px 10px;
    background: rgba(245, 158, 11, 0.1);
    border: 1px solid rgba(245, 158, 11, 0.25);
    border-radius: 6px;
    color: #f59e0b;
    font-size: 0.78rem;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    flex-shrink: 0;
    transition: all 0.2s;
  }

  .btn-restaurar:hover:not(:disabled) {
    background: rgba(245, 158, 11, 0.2);
  }

  .btn-restaurar:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
