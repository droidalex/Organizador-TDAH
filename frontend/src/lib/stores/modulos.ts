import { writable } from 'svelte/store';
import type { Modulo } from '../types';

function createModulosStore() {
  const { subscribe, set, update } = writable<Modulo[]>([]);

  return {
    subscribe,
    registrarModulo: (modulo: Modulo) => {
      update(modulos => {
        if (modulos.find(m => m.id === modulo.id)) {
          return modulos;
        }
        return [...modulos, modulo];
      });
    },
    removerModulo: (id: string) => {
      update(modulos => modulos.filter(m => m.id !== id));
    },
    set,
    reset: () => set([])
  };
}

export const modulosStore = createModulosStore();
export const moduloAtivo = writable<string>('ideias');
