package app

import (
	"context"
)

// App struct
type App struct {
	ctx       context.Context
	AssetsDir string
}

// NewApp cria uma nova instância da aplicação
func NewApp(assetsDir string) *App {
	return &App{
		AssetsDir: assetsDir,
	}
}

// Startup é chamado quando o app inicia
func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx
}
