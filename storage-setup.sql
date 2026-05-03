-- ==================== SUPABASE STORAGE SETUP ====================
-- Execute este script no SQL Editor do Supabase

-- 1. Criar bucket para vídeos (se não existir)
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-videos', 'course-videos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Políticas de acesso ao bucket

-- Permitir leitura pública (qualquer um pode ver os vídeos)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'course-videos');

-- Permitir upload apenas para usuários autenticados
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'course-videos'
    AND auth.role() = 'authenticated'
);

-- Permitir que usuários deletem apenas seus próprios uploads
CREATE POLICY "Users can delete own uploads"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'course-videos'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Admins podem deletar qualquer vídeo
CREATE POLICY "Admins can delete any video"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'course-videos'
    AND EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'admin'
    )
);
