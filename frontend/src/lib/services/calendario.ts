// Serviço para comunicação com o backend do módulo Calendário
import {
  SalvarEventos as SalvarEventosGo,
  CarregarEventos as CarregarEventosGo,
  AdicionarEvento as AdicionarEventoGo,
  AtualizarEvento as AtualizarEventoGo,
  DeletarEvento as DeletarEventoGo
} from '../../wailsjs/wailsjs/go/handlers/CalendarioHandler';

export interface Evento {
  id: string;
  titulo: string;
  data: string;      // YYYY-MM-DD
  hora: string;      // HH:MM
  descricao: string;
  cor: string;       // Hex color
  createdAt: string;
}

let wailsAvailable = false;

function checkWails() {
  // @ts-ignore
  if (typeof window !== 'undefined' && window.go && window.go.handlers && window.go.handlers.CalendarioHandler) {
    wailsAvailable = true;
    console.log('Wails Calendario disponível');
  } else {
    wailsAvailable = false;
    console.log('Wails Calendario não disponível, usando localStorage');
  }
}

checkWails();

export async function SalvarEventos(eventos: Evento[]): Promise<void> {
  console.log('Salvando', eventos.length, 'eventos');
  
  // Sempre salvar no localStorage como backup
  localStorage.setItem('calendario_data', JSON.stringify(eventos));
  
  if (wailsAvailable) {
    try {
      await SalvarEventosGo(eventos);
      console.log('Eventos salvos no Wails');
    } catch (err) {
      console.error('Erro ao salvar eventos no Wails:', err);
    }
  }
}

export async function CarregarEventos(): Promise<Evento[]> {
  console.log('Carregando eventos...');
  
  if (wailsAvailable) {
    try {
      const eventos = await CarregarEventosGo();
      console.log('Eventos carregados do Wails:', eventos.length);
      if (eventos && eventos.length >= 0) {
        const eventosArray = Array.isArray(eventos) ? eventos : [];
        localStorage.setItem('calendario_data', JSON.stringify(eventosArray));
        return eventosArray;
      }
    } catch (err) {
      console.error('Erro ao carregar eventos do Wails:', err);
    }
  }
  
  // Fallback para localStorage
  const data = localStorage.getItem('calendario_data');
  if (data) {
    console.log('Eventos carregados do localStorage');
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.error('Erro ao parsear eventos:', err);
    }
  }
  
  return [];
}

export async function AdicionarEvento(evento: Evento): Promise<void> {
  console.log('Adicionando evento:', evento.titulo);
  
  if (wailsAvailable) {
    try {
      await AdicionarEventoGo(evento);
      console.log('Evento adicionado no Wails');
      return;
    } catch (err) {
      console.error('Erro ao adicionar evento no Wails:', err);
    }
  }
  
  // Fallback
  const eventos = await CarregarEventos();
  eventos.push(evento);
  await SalvarEventos(eventos);
}

export async function AtualizarEvento(evento: Evento): Promise<void> {
  console.log('Atualizando evento:', evento.id);
  
  if (wailsAvailable) {
    try {
      await AtualizarEventoGo(evento);
      console.log('Evento atualizado no Wails');
      return;
    } catch (err) {
      console.error('Erro ao atualizar evento no Wails:', err);
    }
  }
  
  // Fallback
  const eventos = await CarregarEventos();
  const index = eventos.findIndex(e => e.id === evento.id);
  if (index !== -1) {
    eventos[index] = evento;
    await SalvarEventos(eventos);
  }
}

export async function DeletarEvento(id: string): Promise<void> {
  console.log('Deletando evento:', id);
  
  if (wailsAvailable) {
    try {
      await DeletarEventoGo(id);
      console.log('Evento deletado no Wails');
      return;
    } catch (err) {
      console.error('Erro ao deletar evento no Wails:', err);
    }
  }
  
  // Fallback
  let eventos = await CarregarEventos();
  eventos = eventos.filter(e => e.id !== id);
  await SalvarEventos(eventos);
}

// Cores disponíveis para eventos
export const CORES_EVENTO = [
  { nome: 'Rosa', cor: '#ec4899' },
  { nome: 'Roxo', cor: '#8b5cf6' },
  { nome: 'Azul', cor: '#3b82f6' },
  { nome: 'Verde', cor: '#10b981' },
  { nome: 'Amarelo', cor: '#f59e0b' },
  { nome: 'Vermelho', cor: '#ef4444' },
  { nome: 'Ciano', cor: '#06b6d4' },
  { nome: 'Laranja', cor: '#f97316' },
];
