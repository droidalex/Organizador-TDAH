package handlers

import (
	"context"
	"encoding/json"
	"os"
	"path/filepath"
)

// PassosHandler gerencia as operações do módulo de passos/objetivos
type PassosHandler struct {
	ctx       context.Context
	assetsDir string
	dataFile  string
}

// Passo representa um passo do objetivo
type Passo struct {
	ID        string `json:"id"`
	Descricao string `json:"descricao"`
	Concluido bool   `json:"concluido"`
	Ordem     int    `json:"ordem"`
	CreatedAt string `json:"createdAt"`
}

// NewPassosHandler cria um novo handler
func NewPassosHandler(assetsDir string) *PassosHandler {
	initDir := filepath.Join(assetsDir, "init")
	return &PassosHandler{
		assetsDir: assetsDir,
		dataFile:  filepath.Join(initDir, "passos_data.json"),
	}
}

// Startup é chamado quando o app inicia
func (h *PassosHandler) Startup(ctx context.Context) {
	h.ctx = ctx
}

// SalvarPassos salva a lista de passos
func (h *PassosHandler) SalvarPassos(passos []Passo) error {
	return h.salvarPassosInterno(passos)
}

// CarregarPassos carrega a lista de passos
func (h *PassosHandler) CarregarPassos() ([]Passo, error) {
	// Garantir que a pasta init existe
	initDir := filepath.Join(h.assetsDir, "init")
	if err := os.MkdirAll(initDir, 0755); err != nil {
		return []Passo{}, err
	}

	// Verificar se arquivo existe
	if _, err := os.Stat(h.dataFile); os.IsNotExist(err) {
		// Arquivo não existe - retornar lista vazia (app começa do zero)
		return []Passo{}, nil
	}

	// Carregar dados
	jsonData, err := os.ReadFile(h.dataFile)
	if err != nil {
		return []Passo{}, err
	}

	var passos []Passo
	err = json.Unmarshal(jsonData, &passos)
	if passos == nil {
		passos = []Passo{}
	}
	return passos, err
}

// salvarPassosInterno salva lista de passos (usado internamente)
func (h *PassosHandler) salvarPassosInterno(passos []Passo) error {
	jsonData, err := json.MarshalIndent(passos, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(h.dataFile, jsonData, 0644)
}

// AdicionarPasso adiciona um novo passo
func (h *PassosHandler) AdicionarPasso(passo Passo) error {
	passos, err := h.CarregarPassos()
	if err != nil {
		return err
	}

	// Define a ordem como o próximo número
	passo.Ordem = len(passos) + 1
	passos = append(passos, passo)

	return h.SalvarPassos(passos)
}

// AtualizarPasso atualiza um passo existente
func (h *PassosHandler) AtualizarPasso(updatedPasso Passo) error {
	passos, err := h.CarregarPassos()
	if err != nil {
		return err
	}

	for i, passo := range passos {
		if passo.ID == updatedPasso.ID {
			passos[i] = updatedPasso
			break
		}
	}

	return h.SalvarPassos(passos)
}

// DeletarPasso remove um passo pelo ID
func (h *PassosHandler) DeletarPasso(id string) error {
	passos, err := h.CarregarPassos()
	if err != nil {
		return err
	}

	var filtered []Passo
	for _, passo := range passos {
		if passo.ID != id {
			filtered = append(filtered, passo)
		}
	}

	// Reordena os passos restantes
	for i := range filtered {
		filtered[i].Ordem = i + 1
	}

	return h.SalvarPassos(filtered)
}

// MoverPasso move um passo para cima ou para baixo
func (h *PassosHandler) MoverPasso(passoID string, direcao string) error {
	passos, err := h.CarregarPassos()
	if err != nil {
		return err
	}

	// Encontra o índice do passo
	var idx int
	for i, passo := range passos {
		if passo.ID == passoID {
			idx = i
			break
		}
	}

	if direcao == "cima" && idx > 0 {
		// Troca com o passo anterior
		passos[idx], passos[idx-1] = passos[idx-1], passos[idx]
	} else if direcao == "baixo" && idx < len(passos)-1 {
		// Troca com o próximo passo
		passos[idx], passos[idx+1] = passos[idx+1], passos[idx]
	}

	// Atualiza a ordem de todos os passos
	for i := range passos {
		passos[i].Ordem = i + 1
	}

	return h.SalvarPassos(passos)
}

// ToggleConcluido marca/desmarca um passo como concluído
func (h *PassosHandler) ToggleConcluido(passoID string) error {
	passos, err := h.CarregarPassos()
	if err != nil {
		return err
	}

	for i, passo := range passos {
		if passo.ID == passoID {
			passos[i].Concluido = !passos[i].Concluido
			break
		}
	}

	return h.SalvarPassos(passos)
}
