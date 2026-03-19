import { Injectable, signal, computed, effect, inject, DOCUMENT } from '@angular/core';


export type ThemeId = 'indigo-deep' | 'rose-gold';

export interface Theme {
  id: ThemeId;
  name: string;
  description: string;
  cssClass: string;
  previewBg: string;
  previewPrimary: string;
}

export const THEMES: Theme[] = [
  {
    id: 'indigo-deep',
    name: 'Indigo / Deep',
    description: 'Neutro — ERP, logística, saúde, finanças',
    cssClass: 'theme-indigo-deep',
    previewBg: '#0f0f1a',
    previewPrimary: '#6366f1',
  },
  {
    id: 'rose-gold',
    name: 'Rose Gold / Velvet',
    description: 'Cosméticos — beleza, skincare, perfumaria',
    cssClass: 'theme-rose-gold',
    previewBg: '#1a0a14',
    previewPrimary: '#db2777',
  },
];

const STORAGE_KEY = 'bela-estoque:theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private document = inject(DOCUMENT);

  private _activeThemeId = signal<ThemeId>(this.loadFromStorage());

  readonly activeThemeId = this._activeThemeId.asReadonly();
  readonly activeTheme = computed(
    () => THEMES.find((t) => t.id === this._activeThemeId()) ?? THEMES[0],
  );
  readonly isRoseGold = computed(() => this._activeThemeId() === 'rose-gold');
  readonly isIndigoDeep = computed(
    () => this._activeThemeId() === 'indigo-deep',
  );

  constructor() {
    effect(() => {
      const theme = this.activeTheme();
      this.applyThemeToDOM(theme);
      this.saveToStorage(theme.id);
    });
  }

  setTheme(id: ThemeId): void {
    this._activeThemeId.set(id);
  }

  toggle(): void {
    this._activeThemeId.update((current) =>
      current === 'indigo-deep' ? 'rose-gold' : 'indigo-deep',
    );
  }
  private applyThemeToDOM(theme: Theme): void {
    const body = this.document.body;

    THEMES.forEach((t) => body.classList.remove(t.cssClass));

    body.classList.add(theme.cssClass);
  }

  private saveToStorage(id: ThemeId): void {
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // localStorage pode estar bloqueado em contextos privados
    }
  }

  private loadFromStorage(): ThemeId {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as ThemeId;
      return THEMES.some((t) => t.id === saved) ? saved : 'indigo-deep';
    } catch {
      return 'indigo-deep';
    }
  }
}
