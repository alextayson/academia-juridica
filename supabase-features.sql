-- Certificates table
CREATE TABLE certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    certificate_number VARCHAR(50) UNIQUE NOT NULL,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verification_code VARCHAR(100) UNIQUE NOT NULL,
    pdf_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, course_id)
);

-- Notes table
CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    timestamp_seconds INTEGER, -- Video timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments/Discussions table
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE, -- For replies
    content TEXT NOT NULL,
    is_instructor_reply BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'new_course', 'comment_reply', 'certificate_ready', etc
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_certificates_user ON certificates(user_id);
CREATE INDEX idx_certificates_course ON certificates(course_id);
CREATE INDEX idx_certificates_verification ON certificates(verification_code);
CREATE INDEX idx_notes_user ON notes(user_id);
CREATE INDEX idx_notes_lesson ON notes(lesson_id);
CREATE INDEX idx_comments_lesson ON comments(lesson_id);
CREATE INDEX idx_comments_user ON comments(user_id);
CREATE INDEX idx_comments_parent ON comments(parent_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, is_read);

-- RLS Policies for certificates
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own certificates"
    ON certificates FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Anyone can verify certificates"
    ON certificates FOR SELECT
    USING (true);

-- RLS Policies for notes
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own notes"
    ON notes FOR ALL
    USING (auth.uid() = user_id);

-- RLS Policies for comments
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comments"
    ON comments FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can create comments"
    ON comments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
    ON comments FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
    ON comments FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
    ON notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
    ON notifications FOR UPDATE
    USING (auth.uid() = user_id);

-- Function to generate certificate number
CREATE OR REPLACE FUNCTION generate_certificate_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
BEGIN
    new_number := 'CERT-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0');
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to generate verification code
CREATE OR REPLACE FUNCTION generate_verification_code()
RETURNS TEXT AS $$
BEGIN
    RETURN UPPER(MD5(RANDOM()::TEXT || NOW()::TEXT));
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate certificate when course completed
CREATE OR REPLACE FUNCTION auto_generate_certificate()
RETURNS TRIGGER AS $$
DECLARE
    course_id_var UUID;
    total_lessons INTEGER;
    completed_lessons INTEGER;
BEGIN
    -- Get course_id from lesson
    SELECT l.module_id INTO course_id_var
    FROM lessons l
    JOIN modules m ON l.module_id = m.id
    WHERE l.id = NEW.lesson_id;

    -- Count total and completed lessons
    SELECT COUNT(*) INTO total_lessons
    FROM lessons l
    JOIN modules m ON l.module_id = m.id
    WHERE m.course_id = course_id_var;

    SELECT COUNT(*) INTO completed_lessons
    FROM lesson_progress lp
    JOIN lessons l ON lp.lesson_id = l.id
    JOIN modules m ON l.module_id = m.id
    WHERE m.course_id = course_id_var
    AND lp.user_id = NEW.user_id
    AND lp.completed = TRUE;

    -- If all lessons completed, generate certificate
    IF completed_lessons = total_lessons THEN
        INSERT INTO certificates (user_id, course_id, certificate_number, verification_code)
        VALUES (
            NEW.user_id,
            course_id_var,
            generate_certificate_number(),
            generate_verification_code()
        )
        ON CONFLICT (user_id, course_id) DO NOTHING;

        -- Create notification
        INSERT INTO notifications (user_id, type, title, message, link)
        VALUES (
            NEW.user_id,
            'certificate_ready',
            'Certificado disponível!',
            'Parabéns! Seu certificado está pronto para download.',
            '/certificates'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_certificate
AFTER INSERT OR UPDATE ON lesson_progress
FOR EACH ROW
WHEN (NEW.completed = TRUE)
EXECUTE FUNCTION auto_generate_certificate();

-- Function to notify on comment reply
CREATE OR REPLACE FUNCTION notify_comment_reply()
RETURNS TRIGGER AS $$
DECLARE
    parent_user_id UUID;
BEGIN
    IF NEW.parent_id IS NOT NULL THEN
        SELECT user_id INTO parent_user_id
        FROM comments
        WHERE id = NEW.parent_id;

        IF parent_user_id != NEW.user_id THEN
            INSERT INTO notifications (user_id, type, title, message, link)
            VALUES (
                parent_user_id,
                'comment_reply',
                'Nova resposta ao seu comentário',
                'Alguém respondeu ao seu comentário',
                '/course?lesson=' || NEW.lesson_id
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_comment_reply_notification
AFTER INSERT ON comments
FOR EACH ROW
EXECUTE FUNCTION notify_comment_reply();
