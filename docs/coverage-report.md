\# Code Coverage Report — TalentMatch



\## 1. Introduction



This report documents the code coverage analysis performed on the TalentMatch project using Vitest and the V8 coverage provider.



The objective was to measure the effectiveness of automated unit tests for the shared API utility and authentication modules.



\## 2. Testing Tools



\- \*\*Testing framework:\*\* Vitest 2.1.9

\- \*\*Coverage provider:\*\* V8

\- \*\*Coverage reports:\*\* Text, HTML and LCOV

\- \*\*Test files:\*\* `tests/api.test.ts` and `tests/auth.test.ts`



\## 3. Test Execution



Command used:



```bash

npm run coverage

```



\*\*Execution result:\*\*

\- Test files passed: 2

\- Total tests passed: 20

\- Failed tests: 0



\## 4. Coverage Results



| Coverage Metric | Covered | Total | Percentage |

|---|---:|---:|---:|

| Statements | 69 | 69 | 100% |

| Branches | 28 | 28 | 100% |

| Functions | 9 | 9 | 100% |

| Lines | 69 | 69 | 100% |



\### Module-wise Coverage



| Module | Statements | Branches | Functions | Lines |

|---|---:|---:|---:|---:|

| `api.ts` | 100% | 100% | 100% | 100% |

| `auth.ts` | 100% | 100% | 100% | 100% |



\## 5. Test Coverage Details



\### API Utility Module (`api.ts`)



Tests cover:

\- Successful API responses.

\- Error responses and HTTP status codes.

\- Forbidden responses.

\- PostgreSQL error handling.

\- Duplicate record and constraint violations.

\- Authorization and unexpected database errors.



\### Authentication Module (`auth.ts`)



Tests cover:

\- Session creation and cookie configuration.

\- Retrieval of valid sessions.

\- Missing and invalid session cookies.

\- Session deletion.

\- Role-based access validation.

\- Handling of a missing JWT secret.



\## 6. Conclusion



The automated unit tests achieved 100% statement, branch, function and line coverage for the two configured modules, `api.ts` and `auth.ts`.



All 20 automated tests passed successfully.



These results demonstrate complete coverage of the measured modules. They do not represent 100% coverage of the entire TalentMatch application, as other application modules and routes were not included in the configured coverage scope.



\## 7. Generated Report



The detailed HTML coverage report is available at:



`coverage/index.html`



