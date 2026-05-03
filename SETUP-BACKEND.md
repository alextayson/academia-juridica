# 🚀 Guia Completo de Configuração - Backend Supabase

## 📋 Índice
1. [Criar Projeto Supabase](#1-criar-projeto-supabase)
2. [Configurar Banco de Dados](#2-configurar-banco-de-dados)
3. [Configurar Storage](#3-configurar-storage)
4. [Configurar Google OAuth](#4-configurar-google-oauth)
5. [Configurar Aplicação](#5-configurar-aplicação)
6. [Testar Sistema](#6-testar-sistema)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. Criar Projeto Supabase

### 1.1 Criar Conta
1. Acesse [supabase.com](https://supabase.com)
2. Clique em **"Start your project"**
3. Faça login com GitHub ou email

### 1.2 Criar Novo Projeto
1. Clique em **"New Project"**
2. Preencha:
   - **Name:** `academia-juridica` (ou nome de sua escolha)
   - **Database Password:** Crie uma senha forte (salve em local seguro)
   - **Region:** Escolha mais próxima (ex: South America - São Paulo)
   - **Pricing Plan:** Free (suficiente para começar)
3. Clique em **"Create new project"**
4. Aguarde 2-3 minutos para provisionamento

### 1.3 Obter Credenciais
1. No dashboard, vá em **Settings** → **API**
2. Copie e salve:
   - **Project URL** (ex: `https://xxxxx.supabase.co`)
   - **anon public** key (chave pública)
   - **service_role** key (chave privada - NUNCA exponha no frontend)

---

## 2. Configurar Banco de Dados

### 2.1 Executar Schema SQL

1. No menu lateral, clique em **SQL Editor**
2. Clique em **"New query"**
3. Abra o arquivo `schema.sql` do projeto
4. Copie TODO o conteúdo
5. Cole no editor SQL
6. Clique em **"Run"** (ou pressione Ctrl+Enter)
7. Verifique se aparece "Success. No rows returned"

### 2.2 Verificar Tabelas Criadas

1. Vá em **Table Editor** no menu lateral
2. Você deve ver as tabelas:
   - `profiles` - Perfis de usuários
   - `courses` - Cursos
   - `modules` - Módulos dos cursos
   - `lessons` - Aulas
   - `enrollments` - Matrículas
   - `progress` - Progresso dos alunos
   - `certificates` - Certificados

### 2.3 Verificar Políticas RLS

1. Clique em qualquer tabela
2. Vá na aba **"Policies"**
3. Verifique se as políticas foram criadas
4. Exemplo para `courses`:
   - ✅ Public read access
   - ✅ Admin full access

---

## 3. Configurar Storage

### 3.1 Criar Bucket de Vídeos

1. No menu lateral, clique em **Storage**
2. Clique em **"New bucket"**
3. Preencha:
   - **Name:** `course-videos`
   - **Public bucket:** ✅ Marque esta opção
   - **File size limit:** 500 MB
   - **Allowed MIME types:** `video/mp4, video/webm, video/ogg`
4. Clique em **"Create bucket"**

### 3.2 Configurar Políticas do Bucket

**Opção A: Via SQL (Recomendado)**
1. Vá em **SQL Editor**
2. Abra o arquivo `storage-setup.sql`
3. Copie e cole o conteúdo
4. Execute

**Opção B: Via Interface**
1. Clique no bucket `course-videos`
2. Vá em **"Policies"**
3. Crie 4 políticas:

**Política 1: Leitura Pública**
```
Name: Public Access
Operation: SELECT
Target roles: public
Policy definition: bucket_id = 'course-videos'
```

**Política 2: Upload Autenticado**
```
Name: Authenticated Upload
Operation: INSERT
Target roles: authenticated
Policy definition: bucket_id = 'course-videos'
```

**Política 3: Deletar Próprios Arquivos**
```
Name: Delete Own Files
Operation: DELETE
Target roles: authenticated
Policy definition: 
bucket_id = 'course-videos' AND 
auth.uid()::text = (storage.foldername(name))[1]
```

**Política 4: Admin Delete All**
```
Name: Admin Delete All
Operation: DELETE
Target roles: authenticated
Policy definition:
bucket_id = 'course-videos' AND
EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() AND role = 'admin'
)
```

### 3.3 Testar Upload

1. Abra `video-upload.html` no navegador
2. Faça login como admin
3. Tente fazer upload de um vídeo pequeno
4. Verifique se aparece no bucket

---

## 4. Configurar Google OAuth

### 4.1 Criar Projeto no Google Cloud

1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Crie um novo projeto ou selecione existente
3. Nome sugerido: `Academia Jurídica Auth`

### 4.2 Configurar OAuth Consent Screen

1. No menu lateral, vá em **APIs & Services** → **OAuth consent screen**
2. Escolha **External**
3. Preencha:
   - **App name:** Academia Jurídica
   - **User support email:** seu email
   - **Developer contact:** seu email
4. Clique em **"Save and Continue"**
5. Em **Scopes**, clique em **"Add or Remove Scopes"**
6. Adicione:
   - `userinfo.email`
   - `userinfo.profile`
7. Clique em **"Save and Continue"**
8. Em **Test users**, adicione seu email para testes
9. Clique em **"Save and Continue"**

### 4.3 Criar Credenciais OAuth

1. Vá em **APIs & Services** → **Credentials**
2. Clique em **"Create Credentials"** → **OAuth client ID**
3. Escolha **Web application**
4. Preencha:
   - **Name:** Academia Jurídica Web
   - **Authorized JavaScript origins:**
     ```
     http://localhost:5500
     http://127.0.0.1:5500
     https://seu-dominio.com (quando publicar)
     ```
   - **Authorized redirect URIs:**
     ```
     https://xxxxx.supabase.co/auth/v1/callback
     ```
     (substitua `xxxxx` pelo seu Project ID do Supabase)
5. Clique em **"Create"**
6. Copie o **Client ID** e **Client Secret**

### 4.4 Configurar no Supabase

1. No Supabase, vá em **Authentication** → **Providers**
2. Encontre **Google** na lista
3. Clique para expandir
4. Ative o toggle **"Enable Sign in with Google"**
5. Cole:
   - **Client ID** (do Google Cloud)
   - **Client Secret** (do Google Cloud)
6. Clique em **"Save"**

### 4.5 Testar OAuth

1. Abra `login.html`
2. Clique em **"Continuar com Google"**
3. Faça login com sua conta Google
4. Deve redirecionar para `index.html` logado

---

## 5. Configurar Aplicação

### 5.1 Atualizar Credenciais

1. Abra `supabase-client.js`
2. Substitua as credenciais:

```javascript
const SUPABASE_URL = 'https://SEU-PROJECT-ID.supabase.co';
const SUPABASE_ANON_KEY = 'SUA-ANON-KEY-AQUI';
```

3. Salve o arquivo

### 5.2 Criar Primeiro Admin

**Opção A: Via SQL**
```sql
-- Execute no SQL Editor após criar sua conta
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'seu-email@exemplo.com';
```

**Opção B: Via Interface**
1. Crie uma conta normal em `login.html`
2. Vá no Supabase → **Table Editor** → **profiles**
3. Encontre seu usuário
4. Edite o campo `role` para `admin`
5. Salve

### 5.3 Estrutura de Arquivos

Verifique se tem todos os arquivos:
```
plataforma-cursos/
├── index.html              # Página inicial
├── login.html              # Login/Signup
├── reset-password.html     # Recuperar senha
├── course.html             # Página do curso
├── lesson.html             # Player de aula
├── admin.html              # Painel admin
├── video-upload.html       # Upload de vídeos
├── styles.css              # Estilos globais
├── supabase-client.js      # Cliente Supabase
├── auth.js                 # Autenticação
├── app.js                  # Lógica principal
├── course.js               # Lógica do curso
├── lesson.js               # Lógica da aula
├── admin.js                # Lógica admin
├── video-api.js            # API de vídeos
├── video-upload.js         # Upload de vídeos
├── schema.sql              # Schema do banco
├── storage-setup.sql       # Setup do storage
└── README.md               # Documentação
```

---

## 6. Testar Sistema

### 6.1 Teste de Autenticação
- [ ] Criar conta nova
- [ ] Fazer login
- [ ] Login com Google
- [ ] Recuperar senha
- [ ] Logout

### 6.2 Teste de Cursos (Admin)
- [ ] Criar curso
- [ ] Criar módulo
- [ ] Criar aula
- [ ] Upload de vídeo
- [ ] Editar curso
- [ ] Deletar curso

### 6.3 Teste de Aluno
- [ ] Ver lista de cursos
- [ ] Matricular em curso
- [ ] Assistir aula
- [ ] Marcar aula como concluída
- [ ] Ver progresso
- [ ] Gerar certificado

---

## 7. Troubleshooting

### Erro: "Invalid API key"
**Causa:** Credenciais incorretas no `supabase-client.js`
**Solução:**
1. Verifique se copiou a chave correta (anon public)
2. Verifique se não tem espaços extras
3. Recarregue a página (Ctrl+F5)

### Erro: "new row violates row-level security policy"
**Causa:** Políticas RLS não configuradas
**Solução:**
1. Execute `schema.sql` novamente
2. Verifique se as políticas foram criadas em cada tabela
3. Teste com usuário admin primeiro

### Erro: "Bucket not found"
**Causa:** Bucket de vídeos não criado
**Solução:**
1. Vá em Storage → Create bucket
2. Nome: `course-videos`
3. Marque como público
4. Execute `storage-setup.sql`

### Erro: Google OAuth não funciona
**Causa:** Redirect URI incorreta
**Solução:**
1. No Google Cloud Console, verifique Authorized redirect URIs
2. Deve ser: `https://SEU-PROJECT-ID.supabase.co/auth/v1/callback`
3. Aguarde 5 minutos para propagar
4. Limpe cache do navegador

### Vídeos não carregam
**Causa:** Políticas de leitura pública não ativas
**Solução:**
1. Vá em Storage → course-videos → Policies
2. Verifique se tem política de SELECT para public
3. Teste a URL do vídeo diretamente no navegador

### Erro: "Failed to fetch"
**Causa:** CORS ou URL incorreta
**Solução:**
1. Verifique se SUPABASE_URL está correto
2. Teste a URL no navegador: `https://SEU-PROJECT-ID.supabase.co`
3. Verifique se o projeto está ativo no Supabase

### Não consigo criar admin
**Causa:** Perfil não criado automaticamente
**Solução:**
```sql
-- Execute no SQL Editor
INSERT INTO profiles (id, email, full_name, role)
VALUES (
  'SEU-USER-ID',  -- Pegue em Authentication → Users
  'seu-email@exemplo.com',
  'Seu Nome',
  'admin'
)
ON CONFLICT (id) DO UPDATE SET role = 'admin';
```

---

## 📞 Suporte

**Documentação Oficial:**
- [Supabase Docs](https://supabase.com/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase Storage](https://supabase.com/docs/guides/storage)

**Comunidade:**
- [Supabase Discord](https://discord.supabase.com)
- [GitHub Issues](https://github.com/supabase/supabase/issues)

---

✅ **Setup completo! Sua plataforma está pronta para uso.**
