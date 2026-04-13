# Easy Inventory — Angular 21 Development Guidelines

> **BelaEstoque** — Sistema de gestão de estoque/inventário com Angular 21, Supabase e Angular Material.

---

## Stack & Tools

| Camada         | Tecnologia                                   |
| -------------- | -------------------------------------------- |
| **Framework**  | Angular 21.2.5                               |
| **Build**      | @angular/build v21 (application builder)     |
| **UI**         | Angular Material 21, Angular CDK             |
| **Backend**    | Supabase (auth + DB + realtime)              |
| **SSR**        | Enabled com Express                          |
| **Styling**    | SCSS (inlineStyleLanguage)                   |
| **Testing**    | Vitest + JSDom (`@angular/build:vitest`)     |
| **HTTP**       | HttpClient com `withFetch()`                 |
| **Reactivity** | Signals (input, output, signal, computed)    |
| **Routing**    | Lazy loading + `withComponentInputBinding()` |

---

## Project Structure

```
src/
├── app/
│   ├── core/                          # Singleton services, guards, interceptors, models
│   │   ├── guards/
│   │   │   └── auth.guard.ts          # CanActivateFn — protege rotas autenticadas
│   │   ├── interceptors/
│   │   │   └── auth.interceptor.ts    # Injeta token nas requisições
│   │   ├── models/
│   │   │   ├── index.ts
│   │   │   ├── common.models.ts       # PaginaResponse, FiltrosBase
│   │   │   ├── products.model.ts      # Produto, ProdutoForm, ProdutoFiltros, StatusEstoque
│   │   │   └── user.model.ts          # User, AuthState, Credentials, AuthResponse
│   │   ├── services/
│   │   │   ├── auth/                  # Serviços de autenticação
│   │   │   ├── product/               # Serviços de produtos
│   │   │   ├── supabase/              # Cliente Supabase
│   │   │   └── auth.service.ts
│   │   └── index.ts
│   │   └── theme.service.ts           # Gerenciamento de tema
│   │
│   ├── features/                      # Feature modules (lazy-loaded)
│   │   ├── auth/
│   │   │   └── login/                 # Tela de login
│   │   └── products/
│   │       ├── form/                  # Formulário de produto (criar/editar)
│   │       └── products/              # Listagem e rotas de produtos
│   │
│   ├── layout/                        # Shell, header, footer, sidenav
│   │
│   ├── shared/
│   │   └── components/                # Componentes reutilizáveis
│   │       └── not-found/             # Página 404
│   │
│   ├── app.component.ts               # Root component (standalone)
│   ├── app.config.ts                  # ApplicationConfig (providers)
│   ├── app.config.server.ts           # Config SSR
│   ├── app.routes.ts                  # Rotas principais
│   └── app.routes.server.ts           # Rotas servidor SSR
│
├── environments/
│   └── environment.ts                 # Supabase URL, API URL
│
├── index.html
├── main.ts                            # Browser bootstrap
├── main.server.ts                     # Server bootstrap
├── server.ts                          # Express server (SSR)
├── styles.scss                        # Global styles + Material theme
└── test-setup.ts                      # Vitest setup
```

---

## Architecture & Patterns

### Standalone Components Only

- **Sem NgModules** — tudo é standalone
- Componentes usam `input()`, `output()`, `inject()`
- Imports declarados diretamente no `@Component({ imports: [...] })`

```typescript
@Component({
  selector: "app-example",
  standalone: true,
  imports: [CommonModule, MatButton],
  template: `<button (click)="clicked.emit()">{{ label() }}</button>`,
})
export class ExampleComponent {
  label = input.required<string>();
  clicked = output<void>();
}
```

### Signal-First Reactivity

- Prefer **Signals** (`signal`, `computed`, `effect`) sobre RxJS para estado local
- Use `input()` / `input.required()` ao invés de `@Input()`
- Use `output()` ao invés de `@Output()` + `EventEmitter`

```typescript
export class ProductListComponent {
  private svc = inject(ProductService);

  products = signal<Produto[]>([]);
  filtered = computed(() => this.products().filter((p) => p.ativo));
  lowStock = computed(() => this.filtered().filter((p) => getStatusEstoque(p) === "baixo"));
  totalValue = computed(() => this.filtered().reduce((s, p) => s + p.preco * p.quantidadeAtual, 0));
}
```

### Services & DI

- `@Injectable({ providedIn: 'root' })` para singletons
- Use `inject()` ao invés de constructor injection
- Trate erros no service layer, não no component

```typescript
@Injectable({ providedIn: "root" })
export class ProductService {
  private http = inject(HttpClient);

  list(filters: ProdutoFiltros): Observable<PaginaResponse<Produto>> {
    return this.http.get<PaginaResponse<Produto>>("/api/produtos", { params: toParams(filters) });
  }
}
```

### HTTP Interceptors

- **Class-based interceptors** registrados via `withInterceptorsFromDi()`
- `AuthInterceptor` injeta token de autenticação em cada request

```typescript
// app.config.ts
provideHttpClient(withFetch(), withInterceptorsFromDi()),
AuthInterceptor,
```

### Guards

- Guards funcionais (`CanActivateFn`)
- `authGuard` redireciona para `/login` se não autenticado

```typescript
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isAuthenticated() || redirect("/login");
};
```

### Routing

- Lazy loading com `loadComponent` e `loadChildren`
- `withComponentInputBinding()` → route params → component inputs
- `withViewTransitions()` → transições suaves de navegação

```typescript
// app.routes.ts
export const routes: Routes = [
  { path: "", redirectTo: "estoque", pathMatch: "full" },
  {
    path: "login",
    loadComponent: () => import("./features/auth/login/login.component").then((m) => m.LoginComponent),
  },
  {
    path: "produtos",
    canActivate: [authGuard],
    loadChildren: () => import("./features/products/products/products.routes").then((m) => m.PRODUTOS_ROUTES),
  },
  {
    path: "**",
    loadComponent: () => import("./shared/components/not-found/not-found/not-found.component").then((m) => m.NotFoundComponent),
  },
];
```

### State Management

| Escopo          | Abordagem                            |
| --------------- | ------------------------------------ |
| Local component | `signal()`, `computed()`, `effect()` |
| Cross-component | Serviços com Signals compartilhadas  |
| Server sync     | Supabase realtime subscriptions      |
| Auth state      | `AuthState` interface no user.model  |

### Models & Domain Types

**Produto** — entidade central do sistema:

```typescript
interface Produto {
  uuid: string;
  id: number;
  nome: string;
  descricao: string;
  preco: number;
  custo: number;
  sku: string;
  codigoBarras: string;
  categoriaId: number;
  categoriaNome?: string;
  fornecedorId: number;
  fornecedorNome?: string;
  quantidadeAtual: number;
  quantidadeMinima: number;
  quantidadeMaxima: number;
  unidade: string; // UN, CX, KG, G, L, ML, PCT
  ativo: boolean;
  imagemUrl?: string;
  criadoEm: string;
  atualizadoEm: string;
  dataValidade?: Date;
}
```

**Status de estoque:**

```typescript
type StatusEstoque = "ok" | "baixo" | "zero" | "excesso";

function getStatusEstoque(p: Produto): StatusEstoque {
  if (p.quantidadeAtual <= 0) return "zero";
  if (p.quantidadeAtual < p.quantidadeMinima) return "baixo";
  if (p.quantidadeAtual > p.quantidadeMaxima) return "excesso";
  return "ok";
}
```

---

## Development Standards

### Styling

- SCSS co-locado com componentes (`styleUrl`)
- Angular Material theming via `provideAnimationsAsync()`
- CSS custom properties para temas dinâmicos

### SSR Compatibility

- SSR habilitado com Express (`server.ts`)
- **Não usar** APIs de browser diretamente em services (localStorage, window)
- Usar `PLATFORM_ID` injection check para código browser-specific

### Testing

```bash
npm test          # Vitest + JSDom
npm test -- --ui  # Vitest UI interativo
```

- Test files: `*.spec.ts`
- Mock Supabase e HTTP calls
- Test services isoladamente com `TestBed`
- Integração para fluxos críticos (login → CRUD)

---

## Commands

```bash
# Development
npm start                   # ng serve (proxy.conf.json ativo em dev)
npm run watch               # ng build --watch --configuration development

# Build
npm run build               # Production build (output: dist/bela-estoque)

# Testing
npm test                    # Vitest
npm test -- --ui            # Vitest UI

# SSR
npm run serve:ssr:bela-estoque  # node dist/bela-estoque/server/server.mjs

# Scaffolding
ng generate component features/foo --standalone
ng generate service core/services/foo
ng generate guard core/guards/foo
ng generate interceptor core/interceptors/foo
```

---

## Environment Configuration

```typescript
// environments/environment.ts
export const environment = {
  production: false,
  supabaseUrl: "https://SEU_PROJECT_ID.supabase.co",
  supabaseKey: "SUA_ANON_KEY_AQUI",
  apiUrl: "http://localhost:8080/api",
};
```

> ⚠️ As chaves do Supabase são placeholder — precisam ser configuradas antes do deploy.

---

## Best Practices Checklist

- [ ] `strict: true` no TypeScript
- [ ] Sem `any` — usar interfaces tipadas
- [ ] `OnPush` change detection onde possível
- [ ] `@defer` para componentes pesados
- [ ] Async pipe nos templates (evitar subscribe manual)
- [ ] SSR-safe (sem browser API direto em services)
- [ ] Error boundaries + mensagens amigáveis
- [ ] Componentes small & focused (single responsibility)
- [ ] Signals > RxJS para estado local
- [ ] Lazy loading em rotas de feature

---

## Domain Rules

| Regra                      | Detalhe                                       |
| -------------------------- | --------------------------------------------- |
| **Estoque baixo**          | `quantidadeAtual < quantidadeMinima` → alerta |
| **Estoque zero**           | `quantidadeAtual <= 0` → crítico              |
| **Estoque excesso**        | `quantidadeAtual > quantidadeMaxima` → aviso  |
| **Produto inativo**        | `ativo === false` → oculto da listagem padrão |
| **Unidades válidas**       | `UN`, `CX`, `KG`, `G`, `L`, `ML`, `PCT`       |
| **SKU / Código de barras** | Identificadores únicos por produto            |

---

## Common Patterns

### Signal Form Pattern

```typescript
form = signal<ProdutoForm>({
  nome: "",
  descricao: "",
  preco: 0,
  custo: 0,
  sku: "",
  codigoBarras: "",
  categoriaId: 0,
  fornecedorId: 0,
  quantidadeAtual: 0,
  quantidadeMinima: 0,
  quantidadeMaxima: 0,
  unidade: "UN",
  ativo: true,
});
```

### Supabase Service Pattern

```typescript
@Injectable({ providedIn: "root" })
export class SupabaseService {
  private client = inject(SupabaseClient);

  async fetchProducts() {
    return await this.client.from("products").select("*");
  }
}
```

### Deferrable Views

```html
@defer {
<app-heavy-chart />
} @loading {
<mat-spinner />
} @placeholder {
<p>Carregando...</p>
}
```
