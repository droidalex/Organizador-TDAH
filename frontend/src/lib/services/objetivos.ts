// Serviço para comunicação com o backend do módulo Objetivos
import {
  CarregarObjetivos as CarregarObjetivosGo,
  SalvarObjetivos as SalvarObjetivosGo,
  AdicionarObjetivo as AdicionarObjetivoGo,
  DeletarObjetivo as DeletarObjetivoGo,
  AtualizarObjetivo as AtualizarObjetivoGo
} from '../../wailsjs/wailsjs/go/handlers/ObjetivosHandler';

export interface Objetivo {
  id: string;
  titulo: string;
  prazo: string;
  progresso: number;
  concluido: boolean;
  createdAt: string;
}

function converterParaObjetivo(data: any): Objetivo {
  return {
    id: data?.id || '',
    titulo: data?.titulo || '',
    prazo: data?.prazo || '',
    progresso: typeof data?.progresso === 'number' ? data.progresso : 0,
    concluido: Boolean(data?.concluido),
    createdAt: data?.createdAt || new Date().toISOString()
  };
}

let wailsAvailable = false;

function checkWails() {
  // @ts-ignore
  if (typeof window !== 'undefined' && window.go && window.go.handlers && window.go.handlers.ObjetivosHandler) {
    wailsAvailable = true;
  } else {
    wailsAvailable = false;
  }
}

checkWails();

export async function CarregarObjetivos(): Promise<Objetivo[]> {
  if (wailsAvailable) {
    try {
      const lista = await CarregarObjetivosGo();
      const result = Array.isArray(lista) ? lista.map(converterParaObjetivo) : [];
      localStorage.setItem('objetivos_data', JSON.stringify(result));
      return result;
    } catch (err) {
      console.error('Erro ao carregar objetivos do Wails:', err);
    }
  }

  const data = localStorage.getItem('objetivos_data');
  if (data) {
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed.map(converterParaObjetivo) : [];
    } catch {
      return [];
    }
  }
  return [];
}

export async function SalvarObjetivos(objetivos: Objetivo[]): Promise<void> {
  localStorage.setItem('objetivos_data', JSON.stringify(objetivos));

  if (wailsAvailable) {
    try {
      await SalvarObjetivosGo(objetivos);
    } catch (err) {
      console.error('Erro ao salvar objetivos no Wails:', err);
    }
  }
}

export async function AdicionarObjetivo(objetivo: Objetivo): Promise<void> {
  if (wailsAvailable) {
    try {
      await AdicionarObjetivoGo(objetivo);
      const lista = await CarregarObjetivosGo();
      localStorage.setItem('objetivos_data', JSON.stringify(lista));
      return;
    } catch (err) {
      console.error('Erro ao adicionar objetivo no Wails:', err);
    }
  }

  const lista = await CarregarObjetivos();
  lista.push(objetivo);
  await SalvarObjetivos(lista);
}

export async function DeletarObjetivo(id: string): Promise<void> {
  if (wailsAvailable) {
    try {
      await DeletarObjetivoGo(id);
      const lista = await CarregarObjetivosGo();
      localStorage.setItem('objetivos_data', JSON.stringify(lista));
      return;
    } catch (err) {
      console.error('Erro ao deletar objetivo no Wails:', err);
    }
  }

  const lista = await CarregarObjetivos();
  await SalvarObjetivos(lista.filter(o => o.id !== id));
}

export async function AtualizarObjetivo(objetivo: Objetivo): Promise<void> {
  if (wailsAvailable) {
    try {
      await AtualizarObjetivoGo(objetivo);
      const lista = await CarregarObjetivosGo();
      localStorage.setItem('objetivos_data', JSON.stringify(lista));
      return;
    } catch (err) {
      console.error('Erro ao atualizar objetivo no Wails:', err);
    }
  }

  const lista = await CarregarObjetivos();
  const idx = lista.findIndex(o => o.id === objetivo.id);
  if (idx !== -1) lista[idx] = objetivo;
  await SalvarObjetivos(lista);
}
