# Integração Supabase - Guia Rápido

## ✅ O que foi integrado

### 1. **index.html** - Home Page
- Autenticação integrada (login/logout)
- Carrega cursos do Supabase
- Mostra progresso real do usuário
- Busca e filtros funcionais

### 2. **course.html** - Player de Vídeo
- Carrega curso completo do banco
- Player de vídeo (YouTube/Vimeo)
- Salva progresso automaticamente
- Lista módulos e aulas

### 3. **progress.html** - Dashboard
- Estatísticas do usuário
- Cursos em andamento
- Progresso detalhado

### 4. **login.html** - Autenticação
- Login com email/senha
- Google OAuth
- Criação de conta

## 🚀 Como usar

### 1. Configure o Supabase
```bash
# Edite supabase-client.js com suas credenciais
const SUPABASE_URL = 'https://seu-projeto.supabase.co';
const SUPABASE_ANON_KEY = 'sua-chave-aqui';
```

### 2. Execute o schema SQL
- Copie todo conteúdo de `supabase-schema.sql`
- Cole no SQL Editor do Supabase
- Execute

### 3. Abra a aplicação
```bash
# Servidor local (recomendado)
python -m http.server 8000
# ou
npx serve
```

Acesse: `http://localhost:8000`

## 📁 Arquivos criados/modificados

**Novos:**
- `app.js` - Lógica da home integrada com Supabase
- `course-player.js` - Player de vídeo com tracking
- `progress.js` - Dashboard de progresso
- `course.html` - Página do player
- `progress.html` - Página de progresso
- `supabase-client.js` - Cliente Supabase
- `auth.js` - Lógica de autenticação
- `video-api.js` - API de vídeos
- `login.html` - Página de login
- `auth-callback.html` - Callback OAuth

**Modificados:**
- `index.html` - Agora usa `app.js` (module)

## 🔄 Fluxo de uso

1. **Usuário acessa** → Verifica autenticação
2. **Não logado** → Redireciona para login
3. **Faz login** → Carrega cursos do Supabase
4. **Clica em curso** → Inscreve automaticamente
5. **Assiste aula** → Salva progresso em tempo real
6. **Vê progresso** → Dashboard atualizado

## 🎯 Próximos passos

1. Popular banco com cursos reais
2. Adicionar painel admin
3. Implementar sistema de pagamentos
4. Adicionar certificados
5. Melhorar tracking de vídeo (YouTube API)

## 🐛 Troubleshooting

**Erro: "Invalid API key"**
- Verifique credenciais em `supabase-client.js`

**Cursos não aparecem**
- Execute o schema SQL
- Popule com dados de exemplo

**Login não funciona**
- Verifique configuração de auth no Supabase
- Confirme redirect URLs para OAuth

**Vídeo não carrega**
- Verifique URL do vídeo
- Teste URL diretamente no navegador
