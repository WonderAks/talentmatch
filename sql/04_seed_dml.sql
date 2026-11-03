-- =====================================================================
-- 04_seed_dml.sql  |  Sample data (INSERT) and UPDATE / DELETE demos
--   Demo logins -> students: Student@123   recruiters: Recruiter@123
-- =====================================================================
\c talentmatch

-- ---- companies -------------------------------------------------------
INSERT INTO companies (name, industry, website, location) VALUES
 ('NovaTech Solutions', 'Software',        'https://novatech.example.com',     'Bengaluru'),
 ('Bright Analytics',   'Data & AI',       'https://brightanalytics.example.com','Hyderabad'),
 ('CyberShield Labs',   'Cybersecurity',   'https://cybershield.example.com',  'Pune'),
 ('GreenLeaf Energy',   'Renewable Energy','https://greenleaf.example.com',    'Chennai'),
 ('FinEdge Capital',    'Finance',         'https://finedge.example.com',      'Mumbai'),
 ('MediCore Health',    'Healthcare',      'https://medicore.example.com',     'Bengaluru');

-- ---- skills ----------------------------------------------------------
INSERT INTO skills (name, category) VALUES
 ('Python','Programming'), ('Java','Programming'), ('JavaScript','Programming'),
 ('TypeScript','Programming'), ('SQL','Database'), ('PostgreSQL','Database'),
 ('MongoDB','Database'), ('React','Web'), ('Next.js','Web'), ('Node.js','Web'),
 ('Machine Learning','AI/ML'), ('NLP','AI/ML'), ('Data Analysis','Data'),
 ('Docker','DevOps'), ('Git','DevOps'), ('Cloud Computing','DevOps'),
 ('Cybersecurity','Security'), ('Network Security','Security'),
 ('Figma','Design'), ('Communication','Soft Skill');

-- ---- students (passwords hashed with bcrypt via pgcrypto) -----------------
INSERT INTO students (name, email, password_hash, phone, date_of_birth, department, resume_text) VALUES
 ('Ananya Rao',     'ananya.rao@example.com',  crypt('Student@123', gen_salt('bf', 10)), '9876500001', '2004-03-14', 'CSE',
  'Built a text classification model using Python and scikit-learn. Experience in NLP, data preprocessing and Jupyter notebooks.'),
 ('Rahul Mehta',    'rahul.mehta@example.com', crypt('Student@123', gen_salt('bf', 10)), '9876500002', '2003-11-02', 'CSE',
  'Developed full stack web apps with React, Node.js and PostgreSQL. Comfortable with REST APIs, Git and Docker.'),
 ('Priya Nair',     'priya.nair@example.com',  crypt('Student@123', gen_salt('bf', 10)), '9876500003', '2004-07-21', 'ISE',
  'Cybersecurity enthusiast. Completed CTF challenges and studied network security, vulnerability scanning and the OWASP top 10.'),
 ('Karthik Iyer',   'karthik.iyer@example.com',crypt('Student@123', gen_salt('bf', 10)), '9876500004', '2003-09-09', 'CSE',
  'Interested in backend engineering. Built REST services in Java and Node.js with SQL databases and query optimisation.'),
 ('Sneha Kulkarni', 'sneha.k@example.com',     crypt('Student@123', gen_salt('bf', 10)), '9876500005', '2004-01-30', 'AIML',
  'Data analysis projects with Python, pandas and SQL. Built dashboards and presented insights. Coursework in statistics.'),
 ('Vikram Shetty',  'vikram.s@example.com',    crypt('Student@123', gen_salt('bf', 10)), '9876500006', '2003-12-12', 'ECE',
  'Worked with IoT sensors and embedded systems. Collected and analysed time-series data using Python.'),
 ('Meera Joshi',    'meera.joshi@example.com', crypt('Student@123', gen_salt('bf', 10)), '9876500007', '2004-05-05', 'CSE',
  'Frontend developer and designer. Built responsive interfaces with Next.js, TypeScript and Figma prototypes.'),
 ('Arjun Reddy',    'arjun.reddy@example.com', crypt('Student@123', gen_salt('bf', 10)), '9876500008', '2003-08-18', 'CSE',
  'Cloud and DevOps learner. Containerised applications with Docker and set up CI/CD pipelines using GitHub Actions on AWS.');

-- ---- recruiters -------------------------------------------------------
INSERT INTO recruiters (company_id, name, email, password_hash, designation)
SELECT c.company_id, v.name, v.email, crypt('Recruiter@123', gen_salt('bf', 10)), v.designation
FROM (VALUES
 ('NovaTech Solutions','Rohan Das',  'rohan@novatech.example.com',       'Engineering Manager'),
 ('Bright Analytics',  'Divya Menon','divya@brightanalytics.example.com','Talent Acquisition Lead'),
 ('CyberShield Labs',  'Manoj Pillai','manoj@cybershield.example.com',   'Security Team Lead'),
 ('GreenLeaf Energy',  'Sana Khan',  'sana@greenleaf.example.com',       'HR Manager'),
 ('FinEdge Capital',   'Arvind Rao', 'arvind@finedge.example.com',       'Campus Recruiter')
) AS v(company, name, email, designation)
JOIN companies c ON c.name = v.company;

-- ---- internships (deadlines are relative to today) --------------------------
INSERT INTO internships (company_id, recruiter_id, title, description, requirements,
                         location, type, stipend, deadline, max_applicants)
SELECT c.company_id, r.recruiter_id, v.title, v.descr, v.req, v.loc, v.typ, v.stipend,
       CURRENT_DATE + v.days, v.maxapp
FROM (VALUES
 ('NovaTech Solutions','rohan@novatech.example.com','Backend Developer Intern',
  'Build REST APIs and database-backed services using Node.js and PostgreSQL. Work on query optimisation, schema design and Docker based deployments.',
  'Node.js, SQL, Git','Bengaluru','Hybrid',25000,45,50),
 ('NovaTech Solutions','rohan@novatech.example.com','Full Stack Web Intern',
  'Develop responsive web applications with React and Next.js and integrate them with REST APIs and a PostgreSQL database.',
  'React, JavaScript, REST','Remote','Remote',20000,40,50),
 ('Bright Analytics','divya@brightanalytics.example.com','Machine Learning Intern',
  'Train and evaluate machine learning models in Python for text classification and NLP tasks. Handle data preprocessing and experiment tracking.',
  'Python, ML basics','Hyderabad','On-site',30000,50,30),
 ('Bright Analytics','divya@brightanalytics.example.com','Data Analyst Intern',
  'Analyse business datasets with SQL and Python, build dashboards and present insights to stakeholders.',
  'SQL, Python, statistics','Hyderabad','Hybrid',22000,35,40),
 ('CyberShield Labs','manoj@cybershield.example.com','Security Analyst Intern',
  'Monitor network traffic, triage vulnerabilities and assist in penetration testing and incident response.',
  'Networking, security fundamentals','Pune','On-site',28000,42,25),
 ('CyberShield Labs','manoj@cybershield.example.com','Application Security Intern',
  'Review web application code for OWASP vulnerabilities, perform threat modelling and implement secure authentication.',
  'Web security, JavaScript','Remote','Remote',26000,38,25),
 ('GreenLeaf Energy','sana@greenleaf.example.com','IoT Data Intern',
  'Collect and analyse sensor data from solar installations using Python and time-series databases.',
  'Python, sensors','Chennai','On-site',18000,30,20),
 ('GreenLeaf Energy','sana@greenleaf.example.com','UI/UX Design Intern',
  'Design user friendly dashboards in Figma and collaborate with frontend developers on component libraries.',
  'Figma, React basics','Remote','Remote',15000,33,20),
 ('FinEdge Capital','arvind@finedge.example.com','Quantitative Analyst Intern',
  'Build statistical models for risk analysis using Python and SQL, and create data visualisations for the trading desk.',
  'Python, statistics, SQL','Mumbai','Hybrid',35000,48,15),
 ('FinEdge Capital','arvind@finedge.example.com','Cloud DevOps Intern',
  'Automate CI/CD pipelines, containerise applications with Docker and deploy them to cloud infrastructure.',
  'Docker, Git, cloud basics','Remote','Remote',27000,36,20)
) AS v(company, rec_email, title, descr, req, loc, typ, stipend, days, maxapp)
JOIN companies c  ON c.name  = v.company
JOIN recruiters r ON r.email = v.rec_email;

-- ---- internship_skills ------------------------------------------------
INSERT INTO internship_skills (internship_id, skill_id, required_level)
SELECT i.internship_id, s.skill_id, v.lvl
FROM (VALUES
 ('Backend Developer Intern','Node.js','Intermediate'), ('Backend Developer Intern','SQL','Intermediate'),
 ('Backend Developer Intern','PostgreSQL','Beginner'),   ('Backend Developer Intern','Docker','Beginner'),
 ('Full Stack Web Intern','React','Intermediate'),       ('Full Stack Web Intern','Next.js','Beginner'),
 ('Full Stack Web Intern','JavaScript','Intermediate'),  ('Full Stack Web Intern','PostgreSQL','Beginner'),
 ('Machine Learning Intern','Python','Advanced'),        ('Machine Learning Intern','Machine Learning','Intermediate'),
 ('Machine Learning Intern','NLP','Intermediate'),
 ('Data Analyst Intern','SQL','Intermediate'),           ('Data Analyst Intern','Python','Intermediate'),
 ('Data Analyst Intern','Data Analysis','Intermediate'),
 ('Security Analyst Intern','Cybersecurity','Intermediate'), ('Security Analyst Intern','Network Security','Intermediate'),
 ('Application Security Intern','Cybersecurity','Intermediate'), ('Application Security Intern','JavaScript','Beginner'),
 ('Application Security Intern','Git','Beginner'),
 ('IoT Data Intern','Python','Intermediate'),            ('IoT Data Intern','Data Analysis','Beginner'),
 ('IoT Data Intern','Cloud Computing','Beginner'),
 ('UI/UX Design Intern','Figma','Intermediate'),         ('UI/UX Design Intern','React','Beginner'),
 ('Quantitative Analyst Intern','Python','Intermediate'),('Quantitative Analyst Intern','SQL','Intermediate'),
 ('Quantitative Analyst Intern','Data Analysis','Intermediate'),
 ('Cloud DevOps Intern','Docker','Intermediate'),        ('Cloud DevOps Intern','Cloud Computing','Intermediate'),
 ('Cloud DevOps Intern','Git','Intermediate')
) AS v(title, skill, lvl)
JOIN internships i ON i.title = v.title
JOIN skills s      ON s.name  = v.skill;

-- ---- student_skills ---------------------------------------------------
INSERT INTO student_skills (student_id, skill_id, proficiency_level)
SELECT st.student_id, sk.skill_id, v.lvl
FROM (VALUES
 ('ananya.rao@example.com','Python','Advanced'), ('ananya.rao@example.com','Machine Learning','Intermediate'),
 ('ananya.rao@example.com','NLP','Intermediate'), ('ananya.rao@example.com','SQL','Beginner'),
 ('ananya.rao@example.com','Data Analysis','Intermediate'),
 ('rahul.mehta@example.com','JavaScript','Advanced'), ('rahul.mehta@example.com','React','Advanced'),
 ('rahul.mehta@example.com','Node.js','Intermediate'), ('rahul.mehta@example.com','PostgreSQL','Intermediate'),
 ('rahul.mehta@example.com','Git','Advanced'), ('rahul.mehta@example.com','Docker','Beginner'),
 ('priya.nair@example.com','Cybersecurity','Advanced'), ('priya.nair@example.com','Network Security','Intermediate'),
 ('priya.nair@example.com','Python','Intermediate'), ('priya.nair@example.com','Git','Beginner'),
 ('karthik.iyer@example.com','Java','Advanced'), ('karthik.iyer@example.com','Node.js','Intermediate'),
 ('karthik.iyer@example.com','SQL','Advanced'), ('karthik.iyer@example.com','PostgreSQL','Intermediate'),
 ('sneha.k@example.com','Python','Advanced'), ('sneha.k@example.com','SQL','Intermediate'),
 ('sneha.k@example.com','Data Analysis','Advanced'), ('sneha.k@example.com','Machine Learning','Beginner'),
 ('vikram.s@example.com','Python','Intermediate'), ('vikram.s@example.com','Data Analysis','Beginner'),
 ('vikram.s@example.com','Cloud Computing','Beginner'),
 ('meera.joshi@example.com','TypeScript','Advanced'), ('meera.joshi@example.com','Next.js','Advanced'),
 ('meera.joshi@example.com','React','Advanced'), ('meera.joshi@example.com','Figma','Intermediate'),
 ('arjun.reddy@example.com','Docker','Advanced'), ('arjun.reddy@example.com','Cloud Computing','Intermediate'),
 ('arjun.reddy@example.com','Git','Advanced'), ('arjun.reddy@example.com','Python','Beginner')
) AS v(email, skill, lvl)
JOIN students st ON st.email = v.email
JOIN skills sk   ON sk.name  = v.skill;

-- ---- applications (triggers fire: count, history, validation) ----------------
INSERT INTO applications (student_id, internship_id)
SELECT st.student_id, i.internship_id
FROM (VALUES
 ('ananya.rao@example.com','Machine Learning Intern'), ('ananya.rao@example.com','Data Analyst Intern'),
 ('ananya.rao@example.com','Quantitative Analyst Intern'),
 ('rahul.mehta@example.com','Full Stack Web Intern'), ('rahul.mehta@example.com','Backend Developer Intern'),
 ('priya.nair@example.com','Security Analyst Intern'), ('priya.nair@example.com','Application Security Intern'),
 ('karthik.iyer@example.com','Backend Developer Intern'),
 ('sneha.k@example.com','Data Analyst Intern'), ('sneha.k@example.com','Quantitative Analyst Intern'),
 ('vikram.s@example.com','IoT Data Intern'),
 ('meera.joshi@example.com','Full Stack Web Intern'), ('meera.joshi@example.com','UI/UX Design Intern'),
 ('arjun.reddy@example.com','Cloud DevOps Intern')
) AS v(email, title)
JOIN students st   ON st.email = v.email
JOIN internships i ON i.title  = v.title;

-- ---- saved_internships ----------------------------------------------------
INSERT INTO saved_internships (student_id, internship_id)
SELECT st.student_id, i.internship_id
FROM (VALUES
 ('ananya.rao@example.com','IoT Data Intern'), ('rahul.mehta@example.com','Cloud DevOps Intern'),
 ('priya.nair@example.com','Backend Developer Intern'), ('sneha.k@example.com','Machine Learning Intern'),
 ('meera.joshi@example.com','Application Security Intern'), ('arjun.reddy@example.com','Backend Developer Intern'),
 ('rahul.mehta@example.com','Full Stack Web Intern')
) AS v(email, title)
JOIN students st   ON st.email = v.email
JOIN internships i ON i.title  = v.title;

-- ---- UPDATE: recruiters move applications through the pipeline --------------
UPDATE applications SET status = 'Under Review'
WHERE (student_id, internship_id) IN (
    SELECT st.student_id, i.internship_id FROM students st, internships i
    WHERE (st.email, i.title) IN (('rahul.mehta@example.com','Full Stack Web Intern'),
                                  ('karthik.iyer@example.com','Backend Developer Intern'),
                                  ('sneha.k@example.com','Quantitative Analyst Intern'),
                                  ('arjun.reddy@example.com','Cloud DevOps Intern')));
UPDATE applications SET status = 'Shortlisted'
WHERE (student_id, internship_id) IN (
    SELECT st.student_id, i.internship_id FROM students st, internships i
    WHERE (st.email, i.title) IN (('ananya.rao@example.com','Machine Learning Intern'),
                                  ('priya.nair@example.com','Security Analyst Intern')));
UPDATE applications SET status = 'Selected'
WHERE (student_id, internship_id) IN (
    SELECT st.student_id, i.internship_id FROM students st, internships i
    WHERE st.email = 'meera.joshi@example.com' AND i.title = 'UI/UX Design Intern');
UPDATE applications SET status = 'Rejected'
WHERE (student_id, internship_id) IN (
    SELECT st.student_id, i.internship_id FROM students st, internships i
    WHERE st.email = 'vikram.s@example.com' AND i.title = 'IoT Data Intern');

-- ---- UPDATE: extend a deadline ----------------------------------------------
UPDATE internships SET deadline = deadline + INTERVAL '7 days'
WHERE title = 'Quantitative Analyst Intern';

-- ---- DELETE: clean saved list entries that were already applied to -------------
DELETE FROM saved_internships si
USING applications a
WHERE si.student_id = a.student_id AND si.internship_id = a.internship_id;
