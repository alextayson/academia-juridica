# 📋 Guia de Configuração do Supabase Storage

## Passo 1: Acessar o Supabase Dashboard

1. Acesse [supabase.com](https://supabase.com)
2. Faça login no seu projeto
3. No menu lateral, clique em **Storage**

## Passo 2: Criar o Bucket

1. Clique em **"New bucket"**
2. Preencha:
   - **Name:** `course-videos`
   - **Public bucket:** ✅ Marque esta opção
   - **File size limit:** 500 MB (opcional)
   - **Allowed MIME types:** `video/mp4, video/webm, video/ogg` (opcional)
3. Clique em **"Create bucket"**

## Passo 3: Configurar Políticas de Segurança (RLS)

1. Clique no bucket `course-videos`
2. Vá para a aba **"Policies"**
3. Clique em **"New policy"**

### Política 1: Leitura Pública
```
Policy name: Public Access
Allowed operation: SELECT
Target roles: public
USING expression: bucket_id = 'course-videos'
```

### Política 2: Upload Autenticado
```
Policy name: Authenticated Upload
Allowed operation: INSERT
Target roles: authenticated
WITH CHECK expression: bucket_id = 'course-videos'
```

### Política 3: Deletar Próprios Arquivos
```
Policy name: Delete Own Files
Allowed operation: DELETE
Target roles: authenticated
USING expression: bucket_id = 'course-videos' AND auth.uid()::text = (storage.foldername(name))[1]
```

### Política 4: Admin Delete All
```
Policy name: Admin Delete All
Allowed operation: DELETE
Target roles: authenticated
USING expression: 
bucket_id = 'course-videos' AND 
EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() AND role = 'admin'
)
```

## Passo 4: Executar SQL (Alternativa Rápida)

Ou simplesmente execute o arquivo `storage-setup.sql` no **SQL Editor**:

1. Vá em **SQL Editor** no menu lateral
2. Clique em **"New query"**
3. Cole o conteúdo de `storage-setup.sql`
4. Clique em **"Run"**

## Passo 5: Testar

1. Abra `video-upload.html` no navegador
2. Faça login como admin
3. Tente fazer upload de um vídeo pequeno
4. Verifique se aparece no bucket do Supabase

## Estrutura de Pastas

Os vídeos serão salvos em:
```
course-videos/
  └── videos/
      ├── 1234567890_video1.mp4
      ├── 1234567891_video2.mp4
      └── ...
```

## URLs Públicas

Após upload, os vídeos terão URLs públicas:
```
https://[seu-projeto].supabase.co/storage/v1/object/public/course-videos/videos/1234567890_video1.mp4
```

## Troubleshooting

**Erro: "new row violates row-level security policy"**
- Verifique se as políticas RLS foram criadas corretamente
- Confirme que o usuário está autenticado

**Erro: "Bucket not found"**
- Verifique se o bucket `course-videos` foi criado
- Confirme que está marcado como público

**Vídeo não carrega**
- Verifique se a política de leitura pública está ativa
- Teste a URL diretamente no navegador

✅ Configuração completa!
