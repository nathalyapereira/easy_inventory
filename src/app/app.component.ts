import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'bela-estoque';
  private readonly themeService = inject(ThemeService);

  // ngOnInit() {
  //   const theme = this.themeService.activeTheme();
  //   this.themeService.setTheme(theme.id);
  // }
}
