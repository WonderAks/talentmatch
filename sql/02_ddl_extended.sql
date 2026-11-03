-- =====================================================================
-- 02_ddl_extended.sql  |  Phase 2: roles, new tables, vector columns,
--                         constraints, indexes, ALTER / DROP demo
-- =====================================================================
\c talentmatch

-- ---- Extensions ------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS vector;     -- pgvector (vector type + <=> operator)
CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- bcrypt password hashing: crypt(), gen_salt()

-- ---- New table: recruiters (second user role) ------------------------
CREATE TABLE recruiters (
    recruiter_id  SERIAL PRIMARY KEY,
    company_id    INT NOT NULL,
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    designation   VARCHAR(100),
    role          VARCHAR(20) NOT NULL DEFAULT 'recruiter',
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_recruiter_company
        FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    CONSTRAINT chk_recruiter_role  CHECK (role = 'recruiter'),
    CONSTRAINT chk_recruiter_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- ---- ALTER: students (role, resume text, embedding, validation) -------
ALTER TABLE students
    ADD COLUMN role              VARCHAR(20) NOT NULL DEFAULT 'student',
    ADD COLUMN resume_text       TEXT,
    ADD COLUMN profile_embedding vector(384),
    ADD CONSTRAINT chk_student_role  CHECK (role = 'student'),
    ADD CONSTRAINT chk_student_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    ADD CONSTRAINT chk_student_phone CHECK (phone IS NULL OR phone ~ '^[0-9+ -]{10,15}$');

-- ---- ALTER: companies --------------------------------------------------
ALTER TABLE companies
    ADD CONSTRAINT uq_company_name UNIQUE (name);

-- ---- ALTER: internships (owner, stipend, capacity, status, embedding) --
ALTER TABLE internships
    ADD COLUMN recruiter_id          INT,
    ADD COLUMN stipend               NUMERIC(10,2),
    ADD COLUMN status                VARCHAR(20) NOT NULL DEFAULT 'Open',
    ADD COLUMN max_applicants        INT NOT NULL DEFAULT 100,
    ADD COLUMN applicant_count       INT NOT NULL DEFAULT 0,
    ADD COLUMN description_embedding vector(384),
    ADD CONSTRAINT fk_internship_recruiter
        FOREIGN KEY (recruiter_id) REFERENCES recruiters(recruiter_id) ON DELETE SET NULL,
    ADD CONSTRAINT chk_stipend          CHECK (stipend IS NULL OR stipend >= 0),
    ADD CONSTRAINT chk_internship_status CHECK (status IN ('Open', 'Closed')),
    ADD CONSTRAINT chk_max_applicants   CHECK (max_applicants > 0),
    ADD CONSTRAINT chk_applicant_count  CHECK (applicant_count >= 0);

-- ---- ALTER: applications (cached semantic match score) ----------------
ALTER TABLE applications
    ADD COLUMN match_score NUMERIC(5,4),
    ADD CONSTRAINT chk_match_score CHECK (match_score IS NULL OR match_score BETWEEN 0 AND 1);

-- ---- New table: internship_skills (M:N internships <-> skills) ---------
CREATE TABLE internship_skills (
    internship_id  INT NOT NULL,
    skill_id       INT NOT NULL,
    required_level VARCHAR(30) NOT NULL DEFAULT 'Beginner',
    PRIMARY KEY (internship_id, skill_id),
    CONSTRAINT fk_isk_internship
        FOREIGN KEY (internship_id) REFERENCES internships(internship_id) ON DELETE CASCADE,
    CONSTRAINT fk_isk_skill
        FOREIGN KEY (skill_id) REFERENCES skills(skill_id) ON DELETE CASCADE,
    CONSTRAINT chk_required_level
        CHECK (required_level IN ('Beginner', 'Intermediate', 'Advanced', 'Expert'))
);

-- ---- New table: application_history (audit trail) ----------------------
CREATE TABLE application_history (
    history_id     SERIAL PRIMARY KEY,
    application_id INT NOT NULL,
    old_status     VARCHAR(30),
    new_status     VARCHAR(30) NOT NULL,
    changed_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_history_application
        FOREIGN KEY (application_id) REFERENCES applications(application_id) ON DELETE CASCADE
);

-- ---- Indexes -----------------------------------------------------------
CREATE INDEX idx_internships_recruiter ON internships(recruiter_id);
CREATE INDEX idx_internships_status    ON internships(status);
CREATE INDEX idx_isk_skill             ON internship_skills(skill_id);
CREATE INDEX idx_history_application   ON application_history(application_id);
CREATE INDEX idx_recruiters_company    ON recruiters(company_id);

-- Full-text search index (GIN) on title + description
CREATE INDEX idx_internships_fts
    ON internships USING GIN (to_tsvector('english', title || ' ' || description));

-- Vector indexes (HNSW, cosine distance)
CREATE INDEX idx_internships_embedding
    ON internships USING hnsw (description_embedding vector_cosine_ops);
CREATE INDEX idx_students_embedding
    ON students USING hnsw (profile_embedding vector_cosine_ops);

-- ---- ALTER / DROP demonstration ---------------------------------------
ALTER TABLE skills ADD COLUMN description TEXT;          -- add a column
ALTER TABLE skills RENAME COLUMN description TO notes;   -- rename it
ALTER TABLE skills DROP COLUMN notes;                    -- drop it

CREATE TABLE demo_scratch (id INT PRIMARY KEY, label VARCHAR(50));
DROP TABLE demo_scratch;                                 -- drop a table

CREATE INDEX idx_tmp_company_name ON companies(name);
DROP INDEX idx_tmp_company_name;                         -- drop an index
