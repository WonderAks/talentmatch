\# TalentMatch – Project Demo Walkthrough



\## 1. Introduction

\- Introduce TalentMatch as an intelligent internship and skill-matching platform.

\- Explain the problem: students struggle to find relevant internships, while recruiters struggle to identify suitable candidates.

\- Explain how TalentMatch uses structured database information and semantic similarity to improve matching.



\## 2. System Architecture

\- Introduce the technology stack:

&#x20; - Next.js 15 and React 19 for the frontend.

&#x20; - TypeScript and Tailwind CSS.

&#x20; - PostgreSQL with pgvector for database storage and vector similarity.

&#x20; - Next.js Route Handlers for APIs.

&#x20; - JWT sessions for authentication.

\- Explain how the frontend communicates with the backend and database.



\## 3. ER Diagram and Database Schema

\- Present the ER diagram.

\- Explain the major entities and their relationships.

\- Show the relational schema.

\- Explain primary keys, foreign keys and constraints.



\## 4. Database Implementation

\- Demonstrate the SQL scripts in execution order.

\- Explain table creation and constraints.

\- Demonstrate DDL and DML operations.

\- Explain the use of indexes, views, stored procedures and functions.



\## 5. Advanced Database Features

\- Explain the four triggers and their purposes.

\- Demonstrate stored procedures and transactions.

\- Explain the SAVEPOINT transaction example.

\- Discuss B-tree, GIN full-text and HNSW vector indexes.

\- Explain how pgvector stores embeddings and supports cosine similarity.



\## 6. Student Interface Demonstration

\- Log in using a student demo account.

\- Show the student dashboard.

\- Demonstrate internship search and filters.

\- Show semantic search and recommendations.

\- Demonstrate applying for and saving internships.

\- Show the skill-gap feature and student profile.



\## 7. Recruiter Interface Demonstration

\- Log in using a recruiter demo account.

\- Show recruiter dashboard and statistics.

\- Demonstrate ranked applicants.

\- Change an applicant's application status.

\- Demonstrate posting, closing and reopening an internship.



\## 8. Authentication and Access Control

\- Explain password hashing using bcrypt through PostgreSQL pgcrypto.

\- Explain JWT-based sessions using HTTP-only cookies.

\- Demonstrate role-based access control.

\- Show that a student cannot access recruiter-only pages.



\## 9. Testing

\- Present the interface test cases.

\- Demonstrate successful and unsuccessful login attempts.

\- Show search, recommendations and application workflows.

\- Demonstrate recruiter status updates and student status history.

\- Present the actual test results.



\## 10. Conclusion

\- Summarise how TalentMatch combines relational database capabilities with semantic matching.

\- Explain how the platform benefits students and recruiters.

\- Conclude with the important database concepts demonstrated by the project.

