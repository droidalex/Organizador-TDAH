package handlers

import (
	"context"
	"encoding/json"
	"os"
	"path/filepath"
)

// LinksHandler gerencia as operações do módulo de links
type LinksHandler struct {
	ctx       context.Context
	assetsDir string
	dataFile  string
}

// Link representa um link salvo
type Link struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	URL         string `json:"url"`
	Description string `json:"description,omitempty"`
	CreatedAt   string `json:"createdAt"`
}

// NewLinksHandler cria um novo handler
func NewLinksHandler(assetsDir string) *LinksHandler {
	initDir := filepath.Join(assetsDir, "init")
	return &LinksHandler{
		assetsDir: assetsDir,
		dataFile:  filepath.Join(initDir, "links_data.json"),
	}
}

// Startup é chamado quando o app inicia
func (h *LinksHandler) Startup(ctx context.Context) {
	h.ctx = ctx
}

// SalvarLinks salva a lista de links
func (h *LinksHandler) SalvarLinks(links []Link) error {
	return h.salvarLinksInterno(links)
}

// CarregarLinks carrega a lista de links
func (h *LinksHandler) CarregarLinks() ([]Link, error) {
	// Garantir que a pasta init existe
	initDir := filepath.Join(h.assetsDir, "init")
	if err := os.MkdirAll(initDir, 0755); err != nil {
		return []Link{}, err
	}

	// Verificar se arquivo existe
	if _, err := os.Stat(h.dataFile); os.IsNotExist(err) {
		// Arquivo não existe - retornar lista vazia (app começa do zero)
		return []Link{}, nil
	}

	// Carregar dados
	jsonData, err := os.ReadFile(h.dataFile)
	if err != nil {
		return []Link{}, err
	}

	var links []Link
	err = json.Unmarshal(jsonData, &links)
	if links == nil {
		links = []Link{}
	}
	return links, err
}

// salvarLinksInterno salva lista de links (usado internamente)
func (h *LinksHandler) salvarLinksInterno(links []Link) error {
	jsonData, err := json.MarshalIndent(links, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(h.dataFile, jsonData, 0644)
}

// AdicionarLink adiciona um novo link
func (h *LinksHandler) AdicionarLink(link Link) error {
	links, err := h.CarregarLinks()
	if err != nil {
		return err
	}
	links = append(links, link)
	return h.SalvarLinks(links)
}

// DeletarLink remove um link pelo ID
func (h *LinksHandler) DeletarLink(id string) error {
	links, err := h.CarregarLinks()
	if err != nil {
		return err
	}

	var filtered []Link
	for _, link := range links {
		if link.ID != id {
			filtered = append(filtered, link)
		}
	}

	return h.SalvarLinks(filtered)
}

// AtualizarLink atualiza um link existente
func (h *LinksHandler) AtualizarLink(updatedLink Link) error {
	links, err := h.CarregarLinks()
	if err != nil {
		return err
	}

	for i, link := range links {
		if link.ID == updatedLink.ID {
			links[i] = updatedLink
			break
		}
	}

	return h.SalvarLinks(links)
}
