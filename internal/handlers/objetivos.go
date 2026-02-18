package handlers

import (
	"context"
	"encoding/json"
	"os"
	"path/filepath"
)

// ObjetivosHandler gerencia as operações do módulo de objetivos
type ObjetivosHandler struct {
	ctx       context.Context
	assetsDir string
	dataFile  string
}

// Objetivo representa uma meta com progresso
type Objetivo struct {
	ID        string  `json:"id"`
	Titulo    string  `json:"titulo"`
	Prazo     string  `json:"prazo"`
	Progresso float64 `json:"progresso"`
	Concluido bool    `json:"concluido"`
	CreatedAt string  `json:"createdAt"`
}

// NewObjetivosHandler cria um novo handler
func NewObjetivosHandler(assetsDir string) *ObjetivosHandler {
	initDir := filepath.Join(assetsDir, "init")
	return &ObjetivosHandler{
		assetsDir: assetsDir,
		dataFile:  filepath.Join(initDir, "objetivos_data.json"),
	}
}

// Startup é chamado quando o app inicia
func (h *ObjetivosHandler) Startup(ctx context.Context) {
	h.ctx = ctx
}

// CarregarObjetivos carrega todos os objetivos
func (h *ObjetivosHandler) CarregarObjetivos() ([]Objetivo, error) {
	// Garantir que a pasta init existe
	initDir := filepath.Join(h.assetsDir, "init")
	if err := os.MkdirAll(initDir, 0755); err != nil {
		return []Objetivo{}, err
	}

	// Verificar se arquivo existe
	if _, err := os.Stat(h.dataFile); os.IsNotExist(err) {
		// Arquivo não existe - retornar lista vazia (app começa do zero)
		return []Objetivo{}, nil
	}

	// Carregar dados
	jsonData, err := os.ReadFile(h.dataFile)
	if err != nil {
		return []Objetivo{}, err
	}

	var objetivos []Objetivo
	err = json.Unmarshal(jsonData, &objetivos)
	if objetivos == nil {
		objetivos = []Objetivo{}
	}
	return objetivos, err
}

// salvarObjetivosInterno salva lista de objetivos (usado internamente)
func (h *ObjetivosHandler) salvarObjetivosInterno(objetivos []Objetivo) error {
	jsonData, err := json.MarshalIndent(objetivos, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(h.dataFile, jsonData, 0644)
}

// SalvarObjetivos salva todos os objetivos
func (h *ObjetivosHandler) SalvarObjetivos(objetivos []Objetivo) error {
	return h.salvarObjetivosInterno(objetivos)
}

// AdicionarObjetivo adiciona um novo objetivo
func (h *ObjetivosHandler) AdicionarObjetivo(objetivo Objetivo) error {
	objetivos, err := h.CarregarObjetivos()
	if err != nil {
		return err
	}
	objetivos = append(objetivos, objetivo)
	return h.SalvarObjetivos(objetivos)
}

// DeletarObjetivo remove um objetivo pelo ID
func (h *ObjetivosHandler) DeletarObjetivo(id string) error {
	objetivos, err := h.CarregarObjetivos()
	if err != nil {
		return err
	}

	filtered := []Objetivo{}
	for _, o := range objetivos {
		if o.ID != id {
			filtered = append(filtered, o)
		}
	}
	return h.SalvarObjetivos(filtered)
}

// AtualizarObjetivo atualiza um objetivo existente
func (h *ObjetivosHandler) AtualizarObjetivo(objetivo Objetivo) error {
	objetivos, err := h.CarregarObjetivos()
	if err != nil {
		return err
	}

	for i, o := range objetivos {
		if o.ID == objetivo.ID {
			objetivos[i] = objetivo
			break
		}
	}
	return h.SalvarObjetivos(objetivos)
}
