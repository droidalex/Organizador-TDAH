// Serviço para comunicação com o backend do módulo Planejamento (Kanban)
import {
  SalvarQuadro as SalvarQuadroGo,
  CarregarQuadro as CarregarQuadroGo,
  AdicionarTarefa as AdicionarTarefaGo,
  MoverTarefa as MoverTarefaGo,
  DeletarTarefa as DeletarTarefaGo,
  AtualizarTarefa as AtualizarTarefaGo
} from '../../wailsjs/wailsjs/go/handlers/PlanejamentoHandler';
import { handlers } from '../../wailsjs/wailsjs/go/models';

export interface Tarefa {
  id: string;
  titulo: string;
  descricao: string;
  status: 'objetivo' | 'fazendo' | 'feito';
  createdAt: string;
}

export interface QuadroKanban {
  objetivo: Tarefa[];
  fazendo: Tarefa[];
  feito: Tarefa[];
}

// Helper para converter tarefa qualquer para nosso tipo Tarefa
function converterParaTarefa(data: any): Tarefa {
  const status = data?.status;
  const statusValido = status === 'objetivo' || status === 'fazendo' || status === 'feito' 
    ? status 
    : 'objetivo'; // fallback
  
  return {
    id: data?.id || '',
    titulo: data?.titulo || '',
    descricao: data?.descricao || '',
    status: statusValido,
    createdAt: data?.createdAt || new Date().toISOString()
  };
}

let wailsAvailable = false;

function checkWails() {
  // @ts-ignore
  if (typeof window !== 'undefined' && window.go && window.go.handlers && window.go.handlers.PlanejamentoHandler) {
    wailsAvailable = true;
    console.log('Wails Planejamento disponível');
  } else {
    wailsAvailable = false;
    console.log('Wails Planejamento não disponível, usando localStorage');
  }
}

checkWails();

export async function SalvarQuadro(quadro: QuadroKanban): Promise<void> {
  console.log('Salvando quadro Kanban');
  
  // Sempre salvar no localStorage como backup
  localStorage.setItem('planejamento_data', JSON.stringify(quadro));
  
  if (wailsAvailable) {
    try {
      // Converter para tipo Wails (mesma estrutura, status como string)
      const quadroWails = {
        objetivo: quadro.objetivo.map(t => ({
          id: t.id,
          titulo: t.titulo,
          descricao: t.descricao,
          status: t.status,
          createdAt: t.createdAt
        })),
        fazendo: quadro.fazendo.map(t => ({
          id: t.id,
          titulo: t.titulo,
          descricao: t.descricao,
          status: t.status,
          createdAt: t.createdAt
        })),
        feito: quadro.feito.map(t => ({
          id: t.id,
          titulo: t.titulo,
          descricao: t.descricao,
          status: t.status,
          createdAt: t.createdAt
        }))
      };
      await SalvarQuadroGo(quadroWails as any);
      console.log('Quadro salvo no Wails');
    } catch (err) {
      console.error('Erro ao salvar quadro no Wails:', err);
    }
  }
}

export async function CarregarQuadro(): Promise<QuadroKanban> {
  console.log('Carregando quadro Kanban...');
  
  const quadroVazio: QuadroKanban = {
    objetivo: [],
    fazendo: [],
    feito: []
  };
  
  if (wailsAvailable) {
    try {
      const quadro = await CarregarQuadroGo();
      console.log('Quadro carregado do Wails:', quadro);
      
      // Verifica se o quadro é válido (não null/undefined e tem as 3 colunas)
      if (quadro && typeof quadro === 'object') {
        // Garante que as 3 colunas existam e converte as tarefas
        const quadroValido: QuadroKanban = {
          objetivo: Array.isArray(quadro.objetivo) ? quadro.objetivo.map(converterParaTarefa) : [],
          fazendo: Array.isArray(quadro.fazendo) ? quadro.fazendo.map(converterParaTarefa) : [],
          feito: Array.isArray(quadro.feito) ? quadro.feito.map(converterParaTarefa) : []
        };
        
        localStorage.setItem('planejamento_data', JSON.stringify(quadroValido));
        return quadroValido;
      }
    } catch (err) {
      console.error('Erro ao carregar quadro do Wails:', err);
    }
  }
  
  // Fallback para localStorage
  const data = localStorage.getItem('planejamento_data');
  if (data) {
    console.log('Quadro carregado do localStorage');
    try {
      const parsed = JSON.parse(data);
      // Garante que as 3 colunas existam
      return {
        objetivo: Array.isArray(parsed.objetivo) ? parsed.objetivo.map(converterParaTarefa) : [],
        fazendo: Array.isArray(parsed.fazendo) ? parsed.fazendo.map(converterParaTarefa) : [],
        feito: Array.isArray(parsed.feito) ? parsed.feito.map(converterParaTarefa) : []
      };
    } catch (err) {
      console.error('Erro ao parsear dados do localStorage:', err);
    }
  }
  
  // Retornar quadro vazio se não houver dados
  console.log('Retornando quadro vazio');
  return quadroVazio;
}

export async function AdicionarTarefa(tarefa: Tarefa): Promise<void> {
  console.log('Adicionando tarefa:', tarefa.titulo);
  
  if (wailsAvailable) {
    try {
      // Converter para tipo Wails
      const tarefaWails: handlers.Tarefa = {
        id: tarefa.id,
        titulo: tarefa.titulo,
        descricao: tarefa.descricao,
        status: tarefa.status,
        createdAt: tarefa.createdAt
      };
      await AdicionarTarefaGo(tarefaWails as any);
      console.log('Tarefa adicionada no Wails');
      return;
    } catch (err) {
      console.error('Erro ao adicionar tarefa no Wails:', err);
    }
  }
  
  // Fallback
  const quadro = await CarregarQuadro();
  quadro[tarefa.status].push(tarefa);
  await SalvarQuadro(quadro);
}

export async function MoverTarefa(tarefaID: string, statusOrigem: string, statusDestino: string): Promise<void> {
  console.log('Movendo tarefa:', tarefaID, 'de', statusOrigem, 'para', statusDestino);
  
  if (wailsAvailable) {
    try {
      await MoverTarefaGo(tarefaID, statusOrigem, statusDestino);
      console.log('Tarefa movida no Wails');
      return;
    } catch (err) {
      console.error('Erro ao mover tarefa no Wails:', err);
    }
  }
  
  // Fallback
  const quadro = await CarregarQuadro();
  
  // Encontrar e remover da origem
  const listaOrigem = quadro[statusOrigem as keyof QuadroKanban] as Tarefa[];
  const index = listaOrigem.findIndex(t => t.id === tarefaID);
  
  if (index !== -1) {
    const tarefa = listaOrigem[index];
    listaOrigem.splice(index, 1);
    
    // Adicionar ao destino
    tarefa.status = statusDestino as 'objetivo' | 'fazendo' | 'feito';
    quadro[statusDestino as keyof QuadroKanban].push(tarefa);
    
    await SalvarQuadro(quadro);
  }
}

export async function DeletarTarefa(tarefaID: string, status: string): Promise<void> {
  console.log('Deletando tarefa:', tarefaID);
  
  if (wailsAvailable) {
    try {
      await DeletarTarefaGo(tarefaID, status);
      console.log('Tarefa deletada no Wails');
      return;
    } catch (err) {
      console.error('Erro ao deletar tarefa no Wails:', err);
    }
  }
  
  // Fallback
  const quadro = await CarregarQuadro();
  const lista = quadro[status as keyof QuadroKanban] as Tarefa[];
  const filtered = lista.filter(t => t.id !== tarefaID);
  (quadro[status as keyof QuadroKanban] as Tarefa[]) = filtered;
  await SalvarQuadro(quadro);
}

export async function AtualizarTarefa(tarefa: Tarefa, status: string): Promise<void> {
  console.log('Atualizando tarefa:', tarefa.id);
  
  if (wailsAvailable) {
    try {
      // Converter para tipo Wails
      const tarefaWails: handlers.Tarefa = {
        id: tarefa.id,
        titulo: tarefa.titulo,
        descricao: tarefa.descricao,
        status: tarefa.status,
        createdAt: tarefa.createdAt
      };
      await AtualizarTarefaGo(tarefaWails as any, status);
      console.log('Tarefa atualizada no Wails');
      return;
    } catch (err) {
      console.error('Erro ao atualizar tarefa no Wails:', err);
    }
  }
  
  // Fallback
  const quadro = await CarregarQuadro();
  const lista = quadro[status as keyof QuadroKanban] as Tarefa[];
  const index = lista.findIndex(t => t.id === tarefa.id);
  
  if (index !== -1) {
    lista[index] = tarefa;
    await SalvarQuadro(quadro);
  }
}
