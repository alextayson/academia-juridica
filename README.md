# 📚 Academia Jurídica - Plataforma de Cursos Online

Sistema completo de gestão de cursos com vídeo-aulas, progresso de alunos e certificados.

## 🚀 Tecnologias

- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **Autenticação:** Email/Senha + Google OAuth
- **Storage:** Supabase Storage (vídeos)
- **Hospedagem:** Qualquer servidor estático (Vercel, Netlify, GitHub Pages)

## ✨ Funcionalidades

### Para Alunos
- ✅ Cadastro e login (email ou Google)
- ✅ Navegação de cursos disponíveis
- ✅ Matrícula em cursos
- ✅ Player de vídeo com controles
- ✅ Marcação de aulas concluídas
- ✅ Acompanhamento de progresso
- ✅ Geração de certificados (100% concluído)

### Para Administradores
- ✅ Painel administrativo completo
- ✅ Criar/editar/deletar cursos
- ✅ Criar módulos e aulas
- ✅ Upload de vídeos (direto, YouTube, Vimeo)
- ✅ Gerenciar matrículas
- ✅ Visualizar estatísticas

## 📁 Estrutura do Projeto

```
plataforma-cursos/
├── index.html              # Página inicial (lista de cursos)
├── login.html              # Login/Signup com validação
├── reset-password.html     # Recuperação de senha
├── course.html             # Detalhes do curso
├── lesson.html             # Player de aula
├── admin.html              # Painel administrativo
├── video-upload.html       # Upload de vídeos
├── styles.css              # Estilos globais
├── supabase-client.js      # Cliente Supabase configurado
├── auth.js                 # Lógica de autenticação
├── app.js                  # Lógica da página inicial
├── course.js               # Lógica da página do curso
├── lesson.js               # Lógica do player
├── admin.js                # Lógica do painel admin
├── video-api.js            # API de vídeos
├── video-upload.js         # Lógica de upload
├── schema.sql              # Schema do banco de dados
├── storage-setup.sql       # Configuração do storage
├── SETUP-BACKEND.md        # Guia completo de configuração
└── README.md               # Este arquivo
```

## 🔧 Instalação Rápida

### 1. Clone o Repositório
```bash
git clone <seu-repositorio>
cd plataforma-cursos
```

### 2. Configure o Supabase

Siga o guia completo em **[SETUP-BACKEND.md](SETUP-BACKEND.md)**

Resumo:
1. Crie projeto no [Supabase](https://supabase.com)
2. Execute `schema.sql` no SQL Editor
3. Execute `storage-setup.sql` para configurar storage
4. Configure Google OAuth (opcional)
5. Atualize credenciais em `supabase-client.js`

### 3. Inicie o Servidor Local

**Opção A: Live Server (VS Code)**
```bash
# Instale a extensão Live Server
# Clique com botão direito em index.html → Open with Live Server
```

**Opção B: Python**
```bash
python -m http.server 8000
# Acesse http://localhost:8000
```

**Opção C: Node.js**
```bash
npx serve
# Acesse http://localhost:3000
```

### 4. Crie o Primeiro Admin

Execute no SQL Editor do Supabase:
```sql
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'seu-email@exemplo.com';
```

## 🎯 Uso

### Como Aluno

1. **Criar Conta**
   - Acesse `login.html`
   - Clique em "Criar Conta"
   - Preencha os dados ou use Google

2. **Matricular em Curso**
   - Navegue pelos cursos em `index.html`
   - Clique em "Ver Curso"
   - Clique em "Matricular-se"

3. **Assistir Aulas**
   - Clique em uma aula
   - Assista o vídeo
   - Marque como concluída

4. **Obter Certificado**
   - Complete 100% do curso
   - Clique em "Gerar Certificado"

### Como Admin

1. **Acessar Painel**
   - Faça login como admin
   - Acesse `admin.html`

2. **Criar Curso**
   - Clique em "Novo Curso"
   - Preencha título, descrição, thumbnail
   - Salve

3. **Adicionar Módulos**
   - Abra o curso
   - Clique em "Novo Módulo"
   - Defina título e ordem

4. **Adicionar Aulas**
   - Dentro do módulo
   - Clique em "Nova Aula"
   - Faça upload do vídeo ou cole URL (YouTube/Vimeo)
   - Defina duração e ordem

## 🎨 Personalização

### Cores e Branding

Edite `styles.css`:
```css
:root {
    --primary-color: #714cb6;    /* Cor principal */
    --secondary-color: #2d2654;  /* Cor secundária */
    --accent-color: #9b7fd4;     /* Cor de destaque */
}
```

### Logo

Substitua o emoji 📚 por sua logo em:
- `index.html` (linha 40)
- `login.html` (linha 39)
- `admin.html` (linha 45)

### Textos

Todos os textos estão em português e podem ser editados diretamente nos arquivos HTML.

## 🔐 Segurança

### Políticas RLS (Row Level Security)

Todas as tabelas têm políticas de segurança:
- **Alunos:** Leem apenas seus próprios dados
- **Admins:** Acesso total
- **Público:** Lê cursos e aulas (não dados de progresso)

### Autenticação

- Senhas hasheadas pelo Supabase
- Tokens JWT com expiração
- Google OAuth com PKCE
- Reset de senha via email

### Storage

- Vídeos públicos (leitura)
- Upload apenas autenticados
- Delete apenas próprios arquivos ou admin

## 📊 Banco de Dados

### Tabelas Principais

**profiles**
- Perfis de usuários (aluno/admin)
- Criado automaticamente no signup

**courses**
- Cursos disponíveis
- Thumbnail, descrição, instrutor

**modules**
- Módulos dos cursos
- Ordem sequencial

**lessons**
- Aulas com vídeos
- URL, duração, ordem

**enrollments**
- Matrículas dos alunos
- Data de início

**progress**
- Progresso por aula
- Marcação de conclusão

**certificates**
- Certificados gerados
- Data de emissão

## 🎥 Formatos de Vídeo Suportados

### Upload Direto
- MP4 (recomendado)
- WebM
- OGG
- Máximo: 500MB

### URLs Externas
- YouTube (todos os formatos de URL)
- Vimeo (todos os formatos de URL)
- Vídeos diretos (.mp4, .webm, .ogg)

## 🚀 Deploy

### Vercel
```bash
npm i -g vercel
vercel
```

### Netlify
```bash
npm i -g netlify-cli
netlify deploy
```

### GitHub Pages
1. Push para GitHub
2. Settings → Pages
3. Source: main branch
4. Salvar

**Importante:** Atualize as Authorized redirect URIs no Google Cloud Console com seu domínio de produção.

## 🐛 Troubleshooting

Consulte a seção completa de troubleshooting em **[SETUP-BACKEND.md](SETUP-BACKEND.md#7-troubleshooting)**

### Problemas Comuns

**Erro: Invalid API key**
- Verifique credenciais em `supabase-client.js`

**Vídeos não carregam**
- Verifique políticas do bucket `course-videos`

**Google OAuth não funciona**
- Verifique redirect URI no Google Cloud Console

**Não consigo criar admin**
- Execute SQL para atualizar role do usuário

## 📝 Licença

MIT License - use livremente para projetos pessoais ou comerciais.

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📞 Suporte

- **Documentação:** [SETUP-BACKEND.md](SETUP-BACKEND.md)
- **Supabase Docs:** [supabase.com/docs](https://supabase.com/docs)
- **Issues:** Abra uma issue no GitHub

---

✅ **Plataforma completa e pronta para uso!**
