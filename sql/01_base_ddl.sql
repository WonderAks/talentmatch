-- =====================================================================
-- 01_base_ddl.sql  |  TalentMatch - base schema (already created in Phase 1)
-- =====================================================================
CREATE DATABASE talentmatch;
\c talentmatch

CREATE TABLE students (
    student_id    SERIAL PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    phone         VARCHAR(20),
    date_of_birth DATE,
    department    VARCHAR(100),
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE companies (
    company_id    SERIAL PRIMARY KEY,
    name          VARCHAR(150) NOT NULL,
    industry      VARCHAR(100),
    website       VARCHAR(255),
    location      VARCHAR(150),
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE internships (
    internship_id SERIAL PRIMARY KEY,
    company_id    INT NOT NULL,
    title         VARCHAR(200) NOT NULL,
    description   TEXT NOT NULL,
    requirements  TEXT,
    location      VARCHAR(150),
    type          VARCHAR(50),
    posted_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deadline      DATE,
    CONSTRAINT fk_internship_company
        FOREIGN KEY (company_id) REFERENCES companies(company_id)
        ON DELETE CASCADE,
    CONSTRAINT chk_internship_type
        CHECK (type IN ('Remote', 'On-site', 'Hybrid'))
);

CREATE TABLE skills (
    skill_id      SERIAL PRIMARY KEY,
    name          VARCHAR(100) UNIQUE NOT NULL,
    category      VARCHAR(100)
);

CREATE TABLE student_skills (
    student_id        INT NOT NULL,
    skill_id          INT NOT NULL,
    proficiency_level VARCHAR(30),
    PRIMARY KEY (student_id, skill_id),
    CONSTRAINT fk_student_skill_student
        FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    CONSTRAINT fk_student_skill_skill
        FOREIGN KEY (skill_id) REFERENCES skills(skill_id) ON DELETE CASCADE,
    CONSTRAINT chk_proficiency
        CHECK (proficiency_level IN ('Beginner', 'Intermediate', 'Advanced', 'Expert'))
);

CREATE TABLE applications (
    application_id SERIAL PRIMARY KEY,
    student_id     INT NOT NULL,
    internship_id  INT NOT NULL,
    status         VARCHAR(30) DEFAULT 'Applied',
    applied_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_application_student
        FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    CONSTRAINT fk_application_internship
        FOREIGN KEY (internship_id) REFERENCES internships(internship_id) ON DELETE CASCADE,
    CONSTRAINT chk_application_status
        CHECK (status IN ('Applied', 'Under Review', 'Shortlisted', 'Rejected', 'Selected')),
    CONSTRAINT unique_student_application UNIQUE (student_id, internship_id)
);

CREATE TABLE saved_internships (
    save_id       SERIAL PRIMARY KEY,
    student_id    INT NOT NULL,
    internship_id INT NOT NULL,
    saved_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_saved_student
        FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    CONSTRAINT fk_saved_internship
        FOREIGN KEY (internship_id) REFERENCES internships(internship_id) ON DELETE CASCADE,
    CONSTRAINT unique_saved_internship UNIQUE (student_id, internship_id)
);

-- Indexes (B-tree) on foreign keys and frequently filtered columns
CREATE INDEX idx_internships_company  ON internships(company_id);
CREATE INDEX idx_internships_deadline ON internships(deadline);
CREATE INDEX idx_internships_location ON internships(location);
CREATE INDEX idx_applications_student    ON applications(student_id);
CREATE INDEX idx_applications_internship ON applications(internship_id);
CREATE INDEX idx_applications_status     ON applications(status);
CREATE INDEX idx_student_skills_skill    ON student_skills(skill_id);
