\# TalentMatch – Testing Documentation



\## 1. Overview



This document records the testing performed on the TalentMatch application, covering database functionality, vector-based matching, application startup, and key user workflows.



\## 2. Environment



\- Frontend: Next.js 15, React 19

\- Backend: Next.js Route Handlers

\- Database: PostgreSQL 16

\- Vector extension: pgvector 0.8.7

\- Authentication: JWT-based authentication with HTTP-only cookies

\- Runtime: Node.js 22.20.0



\## 3. Database Testing



| Test Case | Expected Result | Actual Result | Status |

|---|---|---|---|

| Execute base DDL script | Tables and indexes created | Tables and indexes created | Pass |

| Execute extended DDL | Extended schema created | Completed successfully | Pass |

| Create views, functions and triggers | Database objects created | Completed successfully | Pass |

| Insert sample records | Seed data inserted | Records inserted successfully | Pass |

| Generate embeddings | Student and internship embeddings generated | 8 students and 10 internships embedded | Pass |

| Vector similarity search | Relevant internships returned | Ranked results returned | Pass |

| Duplicate application constraint | Duplicate application rejected | Unique constraint rejected insertion | Pass |

| Invalid email constraint | Invalid email rejected | Check constraint rejected insertion | Pass |

| Negative stipend constraint | Negative stipend rejected | Check constraint rejected insertion | Pass |

| Recruiter authorization | Unauthorized update rejected | Authorization error returned | Pass |



\## 4. Application Testing



The following tests were manually performed during application execution.



| Test Case | Expected Result | Actual Result | Status |

|---|---|---|---|

| Start application | Development server starts | Next.js server started successfully | Pass |

| Open homepage | Homepage loads | Homepage displayed successfully | Pass |

| Student registration | Student account created | Registration completed and dashboard opened | Pass |

| Student dashboard | Dashboard sections displayed | Internships, profile and application sections visible | Pass |

| Browse internships | Internship listings displayed | Listings displayed successfully | Pass |

| View internship details | Internship details displayed | Details page loaded successfully | Pass |

| Apply for internship | Application submitted | Application submission succeeded | Pass |

| Recruiter registration | Recruiter account created | Registration completed successfully | Pass |

| Recruiter dashboard | Recruiter dashboard displayed | Dashboard opened successfully | Pass |



\## 5. Test Execution Summary



\- Database scripts: Executed successfully.

\- Sample data: Inserted successfully.

\- Embedding generation: Successful for 8 students and 10 internships.

\- Vector similarity queries: Returned ranked results.

\- Application smoke tests: Passed for the workflows listed above.

\- Constraint and authorization checks: Rejected invalid operations as expected.



\## 6. Conclusion



The initial testing confirmed that the TalentMatch database setup, embedding generation, application startup, student registration, internship browsing, application submission, and recruiter registration workflows functioned successfully.



Further comprehensive testing of all application features, edge cases, and concurrent operations can be performed as part of final system validation.

