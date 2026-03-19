// =============================================================================
// shared/components/theme-switcher/theme-switcher.component.ts
// Botão/seletor de tema para colocar na toolbar
// =============================================================================

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { THEMES, ThemeService } from '../core/theme.service';

@Component({
  selector: 'app-theme-switcher',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
  ],
  template: `
    <!-- Botão toggle rápido (dois temas apenas) -->
    <button
      mat-icon-button
      [matTooltip]="'Tema: ' + themeService.activeTheme().name"
      (click)="themeService.toggle()"
      class="theme-toggle-btn"
      aria-label="Alternar tema"
    >
      <!-- Ícone muda conforme o tema ativo -->
      @if (themeService.isRoseGold()) {
        <mat-icon>favorite</mat-icon>
      } @else {
        <mat-icon>dark_mode</mat-icon>
      }
    </button>

    <!-- Menu com todos os temas (útil se adicionar mais no futuro) -->
    <button
      mat-icon-button
      [matMenuTriggerFor]="themeMenu"
      matTooltip="Escolher tema"
      aria-label="Abrir seletor de temas"
    >
      <mat-icon>palette</mat-icon>
    </button>

    <mat-menu #themeMenu="matMenu" class="theme-menu">
      @for (theme of themes; track theme.id) {
        <button
          mat-menu-item
          (click)="themeService.setTheme(theme.id)"
          [class.theme-menu-item--active]="
            themeService.activeThemeId() === theme.id
          "
        >
          <!-- Preview da cor do tema -->
          <span
            class="theme-preview-dot"
            [style.background]="theme.previewPrimary"
            [style.box-shadow]="'0 0 6px ' + theme.previewPrimary"
          ></span>

          <span class="theme-menu-label">
            <strong>{{ theme.name }}</strong>
            <small>{{ theme.description }}</small>
          </span>

          @if (themeService.activeThemeId() === theme.id) {
            <mat-icon class="theme-check">check</mat-icon>
          }
        </button>
      }
    </mat-menu>
  `,
  styles: [
    `
      :host {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .theme-preview-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        flex-shrink: 0;
        margin-right: 4px;
      }

      .theme-menu-label {
        display: flex;
        flex-direction: column;
        gap: 1px;
        flex: 1;

        strong {
          font-size: 13px;
          font-weight: 500;
        }

        small {
          font-size: 11px;
          opacity: 0.6;
        }
      }

      .theme-check {
        font-size: 16px !important;
        width: 16px !important;
        height: 16px !important;
        opacity: 0.7;
      }

      .theme-menu-item--active {
        background: rgba(128, 128, 255, 0.08);
      }
    `,
  ],
})
export class ThemeSwitcherComponent {
  readonly themeService = inject(ThemeService);
  readonly themes = THEMES;
}
