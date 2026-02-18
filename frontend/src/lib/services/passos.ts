// Serviço para comunicação com o backend do módulo Passos
import {
  SalvarPassos as SalvarPassosGo,
  CarregarPassos as CarregarPassosGo,
  AdicionarPasso as AdicionarPassoGo,
  AtualizarPasso as AtualizarPassoGo,
  DeletarPasso as DeletarPassoGo,
  MoverPasso as MoverPassoGo,
  ToggleConcluido as ToggleConcluidoGo
} from '../../wailsjs/wailsjs/go/handlers/PassosHandler';

export interface Passo {
  id: string;
  descricao: string;
  concluido: boolean;
  ordem: number;
  createdAt: string;
}

let wailsAvailable = false;

function checkWails() {
  // @ts-ignore
  if (typeof window !== 'undefined' && window.go && window.go.handlers && window.go.handlers.PassosHandler) {
    wailsAvailable = true;
    console.log('Wails Passos disponível');
  } else {
    wailsAvailable = false;
    console.log('Wails Passos não disponível, usando localStorage');
  }
}

checkWails();

export async function SalvarPassos(passos: Passo[]): Promise<void> {
  console.log('Salvando', passos.length, 'passos');
  
  // Sempre salvar no localStorage como backup
  localStorage.setItem('passos_data', JSON.stringify(passos));
  
  if (wailsAvailable) {
    try {
      await SalvarPassosGo(passos);
      console.log('Passos salvos no Wails');
    } catch (err) {
      console.error('Erro ao salvar passos no Wails:', err);
    }
  }
}

export async function CarregarPassos(): Promise<Passo[]> {
  console.log('Carregando passos...');
  
  if (wailsAvailable) {
    try {
      const passos = await CarregarPassosGo();
      console.log('Passos carregados do Wails:', passos.length);
      if (passos && passos.length >= 0) {
        // Garante que é um array
        const passosArray = Array.isArray(passos) ? passos : [];
        localStorage.setItem('passos_data', JSON.stringify(passosArray));
        return passosArray;
      }
    } catch (err) {
      console.error('Erro ao carregar passos do Wails:', err);
    }
  }
  
  // Fallback para localStorage
  const data = localStorage.getItem('passos_data');
  if (data) {
    console.log('Passos carregados do localStorage');
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.error('Erro ao parsear passos:', err);
    }
  }
  
  return [];
}

export async function AdicionarPasso(passo: Passo): Promise<void> {
  console.log('Adicionando passo:', passo.descricao);
  
  if (wailsAvailable) {
    try {
      await AdicionarPassoGo(passo);
      console.log('Passo adicionado no Wails');
      return;
    } catch (err) {
      console.error('Erro ao adicionar passo no Wails:', err);
    }
  }
  
  // Fallback: salvar tudo
  const passos = await CarregarPassos();
  passo.ordem = passos.length + 1;
  passos.push(passo);
  await SalvarPassos(passos);
}

export async function AtualizarPasso(passo: Passo): Promise<void> {
  console.log('Atualizando passo:', passo.id);
  
  if (wailsAvailable) {
    try {
      await AtualizarPassoGo(passo);
      console.log('Passo atualizado no Wails');
      return;
    } catch (err) {
      console.error('Erro ao atualizar passo no Wails:', err);
    }
  }
  
  // Fallback
  const passos = await CarregarPassos();
  const index = passos.findIndex(p => p.id === passo.id);
  if (index !== -1) {
    passos[index] = passo;
    await SalvarPassos(passos);
  }
}

export async function DeletarPasso(id: string): Promise<void> {
  console.log('Deletando passo:', id);
  
  if (wailsAvailable) {
    try {
      await DeletarPassoGo(id);
      console.log('Passo deletado no Wails');
      return;
    } catch (err) {
      console.error('Erro ao deletar passo no Wails:', err);
    }
  }
  
  // Fallback
  let passos = await CarregarPassos();
  passos = passos.filter(p => p.id !== id);
  // Reordena
  passos.forEach((p, i) => p.ordem = i + 1);
  await SalvarPassos(passos);
}

export async function MoverPasso(id: string, direcao: 'cima' | 'baixo'): Promise<void> {
  console.log('Movendo passo:', id, 'para', direcao);
  
  if (wailsAvailable) {
    try {
      await MoverPassoGo(id, direcao);
      console.log('Passo movido no Wails');
      return;
    } catch (err) {
      console.error('Erro ao mover passo no Wails:', err);
    }
  }
  
  // Fallback
  const passos = await CarregarPassos();
  const idx = passos.findIndex(p => p.id === id);
  
  if (direcao === 'cima' && idx > 0) {
    [passos[idx], passos[idx - 1]] = [passos[idx - 1], passos[idx]];
  } else if (direcao === 'baixo' && idx < passos.length - 1) {
    [passos[idx], passos[idx + 1]] = [passos[idx + 1], passos[idx]];
  }
  
  // Reordena
  passos.forEach((p, i) => p.ordem = i + 1);
  await SalvarPassos(passos);
}

export async function ToggleConcluido(id: string): Promise<void> {
  console.log('Toggle concluído:', id);
  
  if (wailsAvailable) {
    try {
      await ToggleConcluidoGo(id);
      console.log('Status toggle no Wails');
      return;
    } catch (err) {
      console.error('Erro ao toggle status no Wails:', err);
    }
  }
  
  // Fallback
  const passos = await CarregarPassos();
  const passo = passos.find(p => p.id === id);
  if (passo) {
    passo.concluido = !passo.concluido;
    await SalvarPassos(passos);
  }
}
