-- =====================================================================
-- 06_queries.sql  |  Important queries and transaction demo
-- =====================================================================
\c talentmatch

-- 7.1  Simple query with GROUP BY, HAVING, aggregate -------------------------
-- Applications per internship (only those with 2 or more applicants)
SELECT i.title, c.name AS company, COUNT(a.application_id) AS applicants,
       ROUND(AVG(a.match_score), 3) AS avg_match
FROM internships i
JOIN companies c     ON c.company_id = i.company_id
JOIN applications a  ON a.internship_id = i.internship_id
GROUP BY i.title, c.name
HAVING COUNT(a.application_id) >= 2
ORDER BY applicants DESC, i.title;

-- Number of students per skill (LEFT JOIN keeps unused skills)
SELECT sk.category, sk.name, COUNT(ss.student_id) AS students
FROM skills sk
LEFT JOIN student_skills ss ON ss.skill_id = sk.skill_id
GROUP BY sk.category, sk.name
ORDER BY students DESC, sk.name;

-- Funnel by application status
SELECT status, COUNT(*) AS total FROM applications GROUP BY status ORDER BY total DESC;

-- Window function: rank internships by applications inside each company
SELECT c.name AS company, i.title, i.applicant_count,
       RANK() OVER (PARTITION BY c.company_id ORDER BY i.applicant_count DESC) AS rank_in_company
FROM internships i JOIN companies c ON c.company_id = i.company_id;

-- Full-text search using the GIN index
SELECT internship_id, title,
       ts_rank(to_tsvector('english', title || ' ' || description),
               plainto_tsquery('english', 'python machine learning')) AS rank
FROM internships
WHERE to_tsvector('english', title || ' ' || description)
      @@ plainto_tsquery('english', 'python machine learning')
ORDER BY rank DESC;

-- 7.2  UPDATE operation --------------------------------------------------------
UPDATE applications SET status = 'Under Review'
WHERE status = 'Applied' AND internship_id IN
      (SELECT internship_id FROM internships WHERE title = 'Data Analyst Intern');
SELECT a.application_id, s.name, a.status, a.updated_at
FROM applications a JOIN students s USING (student_id)
WHERE a.internship_id = (SELECT internship_id FROM internships WHERE title = 'Data Analyst Intern');

-- Audit trail written by the trigger
SELECT h.application_id, h.old_status, h.new_status, h.changed_at
FROM application_history h ORDER BY h.history_id DESC LIMIT 8;

-- 7.3  DELETE operation ----------------------------------------------------
-- Remove saved internships whose deadline has passed or that were closed
DELETE FROM saved_internships
WHERE internship_id IN (SELECT internship_id FROM internships
                        WHERE status = 'Closed' OR deadline < CURRENT_DATE);
-- Student withdraws an application (trigger decrements applicant_count)
DELETE FROM applications
WHERE student_id = (SELECT student_id FROM students WHERE email = 'vikram.s@example.com')
  AND internship_id = (SELECT internship_id FROM internships WHERE title = 'IoT Data Intern');

-- 7.4  Correlated query ------------------------------------------------------
-- Internships that received more applications than the average of their own company
SELECT i.title, i.applicant_count
FROM internships i
WHERE i.applicant_count > (SELECT AVG(i2.applicant_count)
                           FROM internships i2
                           WHERE i2.company_id = i.company_id);

-- Students who hold every skill an internship requires (NOT EXISTS / NOT EXISTS)
SELECT s.name, i.title
FROM students s, internships i
WHERE NOT EXISTS (
    SELECT 1 FROM internship_skills isk
    WHERE isk.internship_id = i.internship_id
      AND NOT EXISTS (SELECT 1 FROM student_skills ss
                      WHERE ss.student_id = s.student_id AND ss.skill_id = isk.skill_id))
ORDER BY i.title, s.name;

-- 7.5  Nested query ----------------------------------------------------------
-- Students who applied to any internship of NovaTech Solutions
SELECT name, email FROM students
WHERE student_id IN (SELECT student_id FROM applications
                     WHERE internship_id IN (SELECT internship_id FROM internships
                                             WHERE company_id = (SELECT company_id FROM companies
                                                                 WHERE name = 'NovaTech Solutions')));

-- Students who applied to more internships than the platform average
SELECT s.name, COUNT(*) AS applications
FROM students s JOIN applications a ON a.student_id = s.student_id
GROUP BY s.student_id, s.name
HAVING COUNT(*) > (SELECT AVG(cnt) FROM (SELECT COUNT(*) AS cnt FROM applications GROUP BY student_id) t);

-- Views, functions and procedures in action ------------------------------------
SELECT * FROM v_open_internships ORDER BY deadline LIMIT 5;
SELECT * FROM v_recruiter_internship_stats ORDER BY total_applications DESC;
SELECT * FROM fn_skill_gap(2, 1);
SELECT * FROM fn_recruiter_dashboard(1);
CALL sp_apply_for_internship(2, 3);                       -- Rahul applies to the ML internship
-- Recruiter Divya (Bright Analytics) selects Ananya for the ML internship
DO $$
DECLARE v_app INT; v_rec INT;
BEGIN
    SELECT a.application_id INTO v_app FROM applications a
      JOIN students s ON s.student_id = a.student_id
      JOIN internships i ON i.internship_id = a.internship_id
     WHERE s.email = 'ananya.rao@example.com' AND i.title = 'Machine Learning Intern';
    SELECT recruiter_id INTO v_rec FROM recruiters WHERE email = 'divya@brightanalytics.example.com';
    CALL sp_update_application_status(v_app, 'Selected', v_rec);
    RAISE NOTICE 'Application % updated by recruiter %', v_app, v_rec;
END $$;

-- Transaction with SAVEPOINT -----------------------------------------------------
BEGIN;
UPDATE applications SET status = 'Shortlisted'
WHERE internship_id = 3 AND status = 'Applied';
SAVEPOINT before_reject;
UPDATE applications SET status = 'Rejected' WHERE internship_id = 3;
ROLLBACK TO SAVEPOINT before_reject;   -- undo only the mass rejection
COMMIT;                                -- the shortlisting is kept

-- Integrity checks (each statement below is expected to FAIL) --------------------------
INSERT INTO applications (student_id, internship_id) VALUES (1, 3);             -- duplicate application
INSERT INTO students (name, email, password_hash) VALUES ('Bad', 'not-an-email', 'x');  -- email format
UPDATE internships SET stipend = -5 WHERE internship_id = 1;                    -- negative stipend
-- A recruiter from a different company tries to modify the same application -> rejected
DO $$
DECLARE v_app INT; v_rec INT;
BEGIN
    SELECT a.application_id INTO v_app FROM applications a
      JOIN students s ON s.student_id = a.student_id
      JOIN internships i ON i.internship_id = a.internship_id
     WHERE s.email = 'ananya.rao@example.com' AND i.title = 'Machine Learning Intern';
    SELECT recruiter_id INTO v_rec FROM recruiters WHERE email = 'rohan@novatech.example.com';
    CALL sp_update_application_status(v_app, 'Rejected', v_rec);
END $$;
