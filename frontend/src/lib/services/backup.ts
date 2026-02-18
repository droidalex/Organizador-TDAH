import {
  CriarBackup as CriarBackupGo,
  ListarBackups as ListarBackupsGo,
  RestaurarBackup as RestaurarBackupGo
} from '../../wailsjs/wailsjs/go/handlers/BackupHandler';

export interface BackupInfo {
  nome: string;
  data: string;
  label: string;
}

function wailsDisponivel(): boolean {
  // @ts-ignore
  return typeof window !== 'undefined' && window.go?.handlers?.BackupHandler;
}

export async function criarBackup(): Promise<BackupInfo> {
  if (!wailsDisponivel()) throw new Error('Backup requer o app desktop.');
  return await CriarBackupGo() as BackupInfo;
}

export async function listarBackups(): Promise<BackupInfo[]> {
  if (!wailsDisponivel()) return [];
  const lista = await ListarBackupsGo();
  return (lista as BackupInfo[]) ?? [];
}

export async function restaurarBackup(nome: string): Promise<void> {
  if (!wailsDisponivel()) throw new Error('Restauração requer o app desktop.');
  await RestaurarBackupGo(nome);
}
