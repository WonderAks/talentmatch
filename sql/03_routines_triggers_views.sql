-- =====================================================================
-- 03_routines_triggers_views.sql  |  Views, functions, procedures,
--                                    triggers, transaction demo
-- =====================================================================
\c talentmatch

-- =====================  VIEWS  =======================================

-- Internships a student can still apply to
CREATE OR REPLACE VIEW v_open_internships AS
SELECT i.internship_id, i.title, c.name AS company, i.location, i.type,
       i.stipend, i.deadline,
       i.max_applicants - i.applicant_count AS seats_left
FROM internships i
JOIN companies c ON c.company_id = i.company_id
WHERE i.status = 'Open'
  AND (i.deadline IS NULL OR i.deadline >= CURRENT_DATE)
  AND i.applicant_count < i.max_applicants;

-- Recruiter dashboard: funnel per internship
CREATE OR REPLACE VIEW v_recruiter_internship_stats AS
SELECT i.internship_id, i.recruiter_id, i.title,
       COUNT(a.application_id)                              AS total_applications,
       COUNT(*) FILTER (WHERE a.status = 'Shortlisted')     AS shortlisted,
       COUNT(*) FILTER (WHERE a.status = 'Selected')        AS selected,
       ROUND(AVG(a.match_score), 4)                         AS avg_match_score
FROM internships i
LEFT JOIN applications a ON a.internship_id = i.internship_id
GROUP BY i.internship_id, i.recruiter_id, i.title;

-- Student dashboard: application summary
CREATE OR REPLACE VIEW v_student_application_summary AS
SELECT s.student_id, s.name,
       COUNT(a.application_id)                           AS total_applications,
       COUNT(*) FILTER (WHERE a.status = 'Shortlisted')  AS shortlisted,
       COUNT(*) FILTER (WHERE a.status = 'Selected')     AS selected
FROM students s
LEFT JOIN applications a ON a.student_id = s.student_id
GROUP BY s.student_id, s.name;

-- =====================  FUNCTIONS  ===================================

-- Semantic match score (0..1) between a student profile and an internship
CREATE OR REPLACE FUNCTION fn_compute_match_score(p_student_id INT, p_internship_id INT)
RETURNS NUMERIC AS $$
    SELECT GREATEST(0, ROUND((1 - (s.profile_embedding <=> i.description_embedding))::numeric, 4))
    FROM students s, internships i
    WHERE s.student_id = p_student_id
      AND i.internship_id = p_internship_id
      AND s.profile_embedding IS NOT NULL
      AND i.description_embedding IS NOT NULL;
$$ LANGUAGE sql STABLE;

-- Skills an internship requires that the student does not have yet (skill gap)
CREATE OR REPLACE FUNCTION fn_skill_gap(p_student_id INT, p_internship_id INT)
RETURNS TABLE (skill_name VARCHAR, required_level VARCHAR) AS $$
    SELECT sk.name, isk.required_level
    FROM internship_skills isk
    JOIN skills sk ON sk.skill_id = isk.skill_id
    WHERE isk.internship_id = p_internship_id
      AND NOT EXISTS (SELECT 1 FROM student_skills ss
                      WHERE ss.student_id = p_student_id AND ss.skill_id = isk.skill_id);
$$ LANGUAGE sql STABLE;

-- Recruiter dashboard totals
CREATE OR REPLACE FUNCTION fn_recruiter_dashboard(p_recruiter_id INT)
RETURNS TABLE (internships_posted BIGINT, total_applications BIGINT,
               shortlisted BIGINT, selected BIGINT) AS $$
    SELECT COUNT(DISTINCT i.internship_id),
           COUNT(a.application_id),
           COUNT(*) FILTER (WHERE a.status = 'Shortlisted'),
           COUNT(*) FILTER (WHERE a.status = 'Selected')
    FROM internships i
    LEFT JOIN applications a ON a.internship_id = i.internship_id
    WHERE i.recruiter_id = p_recruiter_id;
$$ LANGUAGE sql STABLE;

-- =====================  STORED PROCEDURES  ===========================

-- Apply for an internship (atomic: any failure rolls the whole call back)
CREATE OR REPLACE PROCEDURE sp_apply_for_internship(p_student_id INT, p_internship_id INT)
LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO applications (student_id, internship_id, match_score)
    VALUES (p_student_id, p_internship_id,
            fn_compute_match_score(p_student_id, p_internship_id));
    -- remove from the saved list once applied
    DELETE FROM saved_internships
    WHERE student_id = p_student_id AND internship_id = p_internship_id;
END;
$$;

-- Recruiter changes an application status (authorisation enforced in the DB)
CREATE OR REPLACE PROCEDURE sp_update_application_status(
    p_application_id INT, p_new_status VARCHAR, p_recruiter_id INT)
LANGUAGE plpgsql AS $$
BEGIN
    IF NOT EXISTS (SELECT 1
                   FROM applications a
                   JOIN internships i ON i.internship_id = a.internship_id
                   WHERE a.application_id = p_application_id
                     AND i.recruiter_id = p_recruiter_id) THEN
        RAISE EXCEPTION 'Recruiter % is not allowed to modify application %',
                        p_recruiter_id, p_application_id USING ERRCODE = '42501';
    END IF;
    UPDATE applications SET status = p_new_status
    WHERE application_id = p_application_id;
END;
$$;

-- =====================  TRIGGERS  ====================================

-- T1: validate an application BEFORE it is inserted (integrity at DB level)
CREATE OR REPLACE FUNCTION trg_fn_validate_application() RETURNS trigger AS $$
DECLARE v RECORD;
BEGIN
    SELECT status, deadline, applicant_count, max_applicants INTO v
    FROM internships WHERE internship_id = NEW.internship_id
    FOR UPDATE;                                   -- lock row: no overbooking race
    IF v.status <> 'Open' THEN
        RAISE EXCEPTION 'Internship % is closed', NEW.internship_id;
    ELSIF v.deadline IS NOT NULL AND v.deadline < CURRENT_DATE THEN
        RAISE EXCEPTION 'Deadline for internship % has passed', NEW.internship_id;
    ELSIF v.applicant_count >= v.max_applicants THEN
        RAISE EXCEPTION 'Internship % has reached its applicant limit', NEW.internship_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_application
BEFORE INSERT ON applications
FOR EACH ROW EXECUTE FUNCTION trg_fn_validate_application();

-- T2: keep internships.applicant_count in sync
CREATE OR REPLACE FUNCTION trg_fn_applicant_count() RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE internships SET applicant_count = applicant_count + 1
        WHERE internship_id = NEW.internship_id;
    ELSE
        UPDATE internships SET applicant_count = GREATEST(applicant_count - 1, 0)
        WHERE internship_id = OLD.internship_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_applicant_count
AFTER INSERT OR DELETE ON applications
FOR EACH ROW EXECUTE FUNCTION trg_fn_applicant_count();

-- T3: stamp updated_at on every change
CREATE OR REPLACE FUNCTION trg_fn_set_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_applications_updated_at
BEFORE UPDATE ON applications
FOR EACH ROW EXECUTE FUNCTION trg_fn_set_updated_at();

-- T4: audit trail of every status change
CREATE OR REPLACE FUNCTION trg_fn_application_history() RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO application_history (application_id, old_status, new_status)
        VALUES (NEW.application_id, NULL, NEW.status);
    ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
        INSERT INTO application_history (application_id, old_status, new_status)
        VALUES (NEW.application_id, OLD.status, NEW.status);
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_application_history
AFTER INSERT OR UPDATE ON applications
FOR EACH ROW EXECUTE FUNCTION trg_fn_application_history();
