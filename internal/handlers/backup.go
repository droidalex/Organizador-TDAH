package handlers

import (
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"
)

const maxBackups = 10

// BackupHandler gerencia backups automáticos e manuais dos dados
type BackupHandler struct {
	ctx       context.Context
	assetsDir string
	backupDir string
}

// BackupInfo representa informações de um backup disponível
type BackupInfo struct {
	Nome  string `json:"nome"`
	Data  string `json:"data"`
	Label string `json:"label"`
}

// NewBackupHandler cria um novo handler de backup
func NewBackupHandler(assetsDir string) *BackupHandler {
	backupDir := filepath.Join(assetsDir, "backups")
	return &BackupHandler{
		assetsDir: assetsDir,
		backupDir: backupDir,
	}
}

// Startup cria backup automático ao iniciar o app
func (h *BackupHandler) Startup(ctx context.Context) {
	h.ctx = ctx
	os.MkdirAll(h.backupDir, 0755)
	// Backup automático na inicialização (silencioso)
	h.fazerBackupInterno()
}

// CriarBackup cria um backup manual e retorna suas informações
func (h *BackupHandler) CriarBackup() (BackupInfo, error) {
	return h.fazerBackupInterno()
}

// ListarBackups retorna todos os backups disponíveis (mais recentes primeiro)
func (h *BackupHandler) ListarBackups() ([]BackupInfo, error) {
	if err := os.MkdirAll(h.backupDir, 0755); err != nil {
		return []BackupInfo{}, err
	}

	entries, err := os.ReadDir(h.backupDir)
	if err != nil {
		return []BackupInfo{}, err
	}

	var backups []BackupInfo
	for _, entry := range entries {
		if entry.IsDir() && strings.HasPrefix(entry.Name(), "backup_") {
			ts := strings.TrimPrefix(entry.Name(), "backup_")
			backups = append(backups, BackupInfo{
				Nome:  entry.Name(),
				Data:  ts,
				Label: formatLabel(ts),
			})
		}
	}

	// Mais recentes primeiro
	sort.Slice(backups, func(i, j int) bool {
		return backups[i].Data > backups[j].Data
	})

	return backups, nil
}

// RestaurarBackup restaura os dados a partir de um backup
func (h *BackupHandler) RestaurarBackup(nome string) error {
	// Validação básica de segurança: nome não pode conter separadores de path
	if strings.ContainsAny(nome, "/\\") {
		return fmt.Errorf("nome de backup inválido")
	}

	backupPath := filepath.Join(h.backupDir, nome)

	// Verificar se o diretório de backup existe
	info, err := os.Stat(backupPath)
	if err != nil || !info.IsDir() {
		return fmt.Errorf("backup não encontrado: %s", nome)
	}

	// Garantir que a pasta init existe
	initDir := filepath.Join(h.assetsDir, "init")
	if err := os.MkdirAll(initDir, 0755); err != nil {
		return fmt.Errorf("erro ao criar pasta init: %w", err)
	}

	entries, err := os.ReadDir(backupPath)
	if err != nil {
		return err
	}

	for _, entry := range entries {
		if !entry.IsDir() && strings.HasSuffix(entry.Name(), "_data.json") {
			src := filepath.Join(backupPath, entry.Name())
			// Restaurar para assets/init/
			dst := filepath.Join(initDir, entry.Name())
			if err := copiarArquivo(src, dst); err != nil {
				return fmt.Errorf("erro ao restaurar %s: %w", entry.Name(), err)
			}
		}
	}

	return nil
}

// --- Funções internas ---

func (h *BackupHandler) fazerBackupInterno() (BackupInfo, error) {
	ts := time.Now().Format("2006-01-02_15-04-05")
	nome := fmt.Sprintf("backup_%s", ts)
	backupPath := filepath.Join(h.backupDir, nome)

	if err := os.MkdirAll(backupPath, 0755); err != nil {
		return BackupInfo{}, err
	}

	// Copiar todos os arquivos *_data.json da pasta init
	initDir := filepath.Join(h.assetsDir, "init")
	entries, err := os.ReadDir(initDir)
	if err != nil {
		// Se a pasta init não existe, pode ser a primeira execução
		// Não criar backup vazio
		os.RemoveAll(backupPath)
		return BackupInfo{}, nil
	}

	copiados := 0
	for _, entry := range entries {
		if !entry.IsDir() && strings.HasSuffix(entry.Name(), "_data.json") {
			src := filepath.Join(initDir, entry.Name())
			dst := filepath.Join(backupPath, entry.Name())
			if err := copiarArquivo(src, dst); err == nil {
				copiados++
			}
		}
	}

	// Se não copiou nada, remover a pasta vazia
	if copiados == 0 {
		os.Remove(backupPath)
		return BackupInfo{}, fmt.Errorf("nenhum arquivo de dados encontrado para backup")
	}

	h.limparAntigos()

	return BackupInfo{
		Nome:  nome,
		Data:  ts,
		Label: formatLabel(ts),
	}, nil
}

func (h *BackupHandler) limparAntigos() {
	entries, err := os.ReadDir(h.backupDir)
	if err != nil {
		return
	}

	var dirs []string
	for _, e := range entries {
		if e.IsDir() && strings.HasPrefix(e.Name(), "backup_") {
			dirs = append(dirs, e.Name())
		}
	}

	// Ordenar do mais antigo para o mais novo
	sort.Strings(dirs)

	for len(dirs) > maxBackups {
		os.RemoveAll(filepath.Join(h.backupDir, dirs[0]))
		dirs = dirs[1:]
	}
}

func copiarArquivo(src, dst string) error {
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer in.Close()

	out, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer out.Close()

	_, err = io.Copy(out, in)
	return err
}

func formatLabel(ts string) string {
	t, err := time.Parse("2006-01-02_15-04-05", ts)
	if err != nil {
		return ts
	}
	return t.Format("02/01/2006 às 15:04:05")
}
