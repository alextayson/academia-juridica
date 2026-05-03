# Academia Jurídica - Plataforma de Cursos

Plataforma completa de cursos online com design premium inspirado no Superhuman.

## 🚀 Como usar no Lovable

### Opção 1: Upload direto
1. Acesse [lovable.dev](https://lovable.dev)
2. Crie novo projeto
3. Arraste todos os arquivos desta pasta
4. Preview automático

### Opção 2: Copiar e colar
1. Crie novo projeto no Lovable
2. Cole cada arquivo no editor:
   - `index.html` → página principal
   - `styles.css` → estilos da home
   - `script.js` → interações da home
   - `curso-player.html` → player de vídeo
   - `player-styles.css` → estilos do player
   - `player-script.js` → controles do player

## 📁 Estrutura

```
plataforma-cursos/
├── index.html              # Home com grid de cursos
├── styles.css              # Estilos da home
├── script.js               # Interações da home
├── curso-player.html       # Player de vídeo
├── player-styles.css       # Estilos do player
├── player-script.js        # Controles do player
└── README.md              # Este arquivo
```

## ✨ Funcionalidades

### Home (index.html)
- Hero section com gradient purple
- Seção "Continue assistindo" com progresso
- Categorias jurídicas (Civil, Empresarial, Trabalhista, Constitucional)
- Grid de cursos com badges (Novo, Popular, Em andamento)
- Design responsivo

### Player (curso-player.html)
- Player de vídeo com controles completos
- Barra de progresso interativa
- Sidebar com módulos e aulas
- Progresso circular (65%)
- Módulos expansíveis
- Tabs: Resumo, Material, Discussão
- Atalhos de teclado (Space, ← →)

## 🎨 Design System

Baseado no Superhuman:
- **Hero**: Purple gradient (#1b1938)
- **Accent**: Lavender (#cbb7fb, #714cb6)
- **Buttons**: Warm cream (#e9e5dd)
- **Text**: Charcoal (#292827)
- **Background**: White (#ffffff) / Dark (#0a0a0a)

## 🔧 Próximos passos

1. **Backend**: Adicionar autenticação e banco de dados
2. **Vídeos**: Integrar Vimeo/YouTube
3. **Pagamentos**: Stripe/Mercado Pago
4. **Admin**: Painel para adicionar cursos
5. **Certificados**: Geração em PDF

## 📦 Deploy rápido

### Vercel (gratuito)
```bash
npm i -g vercel
vercel
```

### Netlify (gratuito)
Arraste a pasta no [netlify.com/drop](https://app.netlify.com/drop)

## 💡 Dicas para Lovable

- Lovable renderiza HTML/CSS/JS automaticamente
- Use o editor visual para ajustes rápidos
- Adicione backend com Supabase (integração nativa)
- Publique com 1 clique

## 📝 Licença

Livre para uso pessoal e comercial.
