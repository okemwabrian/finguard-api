# FinGuard AI — Loan Origination & Credit Risk Backend

A production-oriented financial backend built with **Java 21**, **Spring Boot 4.2**, **PostgreSQL 18**, **Spring Security (JWT + RBAC)**, and **Google Gemini AI** for structured credit risk underwriting.

## Core Architecture & Security
* **Stateless JWT & RBAC:** Role-based access control across `ADMIN`, `LOAN_OFFICER`, `CREDIT_ANALYST`, and `AUDITOR` with BCrypt (cost 12) password hashing.
* **Forced First-Login Password Reset:** Newly onboarded staff are locked to `/api/auth/change-password` via `JwtAuthenticationFilter` until they replace their temporary password.
* **Loan State Machine & Separation of Duties:** Enforces strict transitions (`PENDING` → `UNDER_REVIEW` → `APPROVED` / `REJECTED`), blocks self-reviews, and prevents IDOR by scoping `LOAN_OFFICER` access to their own submissions.
* **AI Credit Risk Scoring with Deterministic Fallback:** Calls Gemini (`gemini-2.5-flash` / `gemini-3.8-flash`) with prompt-injection isolation (`systemInstruction` + untrusted text tags), `thinkingBudget: 0` for low latency, and a deterministic Java `BigDecimal` Debt-to-Income (DTI) fallback if the LLM is unavailable.
* **Immutable Audit Trail:** Every loan creation, status transition, and staff account change is recorded atomically inside `@Transactional` boundaries.
* **Performance & Resilience:** Java 21 Virtual Threads enabled, PostgreSQL indexes on hot columns, paginated list endpoints (`Pageable`), and centralized error handling via `GlobalExceptionHandler`.

## Tech Stack
* **Runtime & Framework:** Java 21, Spring Boot 4.2, Spring Security, Spring Data JPA
* **Database:** PostgreSQL 18
* **AI Integration:** Google Gemini API (`RestClient` + structured JSON output)
* **Docs & Testing:** Springdoc OpenAPI / Swagger UI, JUnit 5, Mockito
* **DevOps:** Multi-stage Docker build, Docker Compose, GitHub Actions CI

## Quick Start

### 1. Local Development
```bash
cp .env.example .env
# Update .env with your PostgreSQL credentials and Gemini API key

./mvnw test
./mvnw spring-boot:run
```
* **Swagger UI:** http://localhost:8080/swagger-ui/index.html
* **Default Admin:** admin@finguard.com / Admin@123

### 2. Docker Compose (API + PostgreSQL 18)
```bash
docker compose up --build
```

## Key API Endpoints
| Method | Endpoint | Role | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public | Authenticate and receive JWT |
| `POST` | `/api/auth/change-password` | Authenticated | Complete forced first-login password reset |
| `POST` | `/api/admin/users` | `ADMIN` | Onboard new staff member |
| `GET` | `/api/admin/users` | `ADMIN` | List all staff accounts |
| `PATCH` | `/api/admin/users/{id}/status` | `ADMIN` | Suspend or reactivate staff account |
| `POST` | `/api/loans` | `LOAN_OFFICER` | Submit loan application + run AI risk scoring |
| `GET` | `/api/loans/my-submissions` | `LOAN_OFFICER` | Paginated list of officer's own loans |
| `GET` | `/api/loans` | `ADMIN`, `CREDIT_ANALYST`, `AUDITOR` | Paginated list of all loans (filterable by status) |
| `PATCH` | `/api/loans/{id}/status` | `CREDIT_ANALYST` | Transition loan state with reviewer notes |
| `GET` | `/api/audit-logs` | `AUDITOR`, `ADMIN` | Paginated immutable compliance audit trail |
