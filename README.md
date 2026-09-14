# ST.MARIA Agency

> Influencer Marketing Platform & Campaign Management System

ST.MARIA is a technology platform designed to support influencer marketing campaigns from campaign creation and creator discovery to collaboration management, performance analysis and internal agency operations.

The project combines a SaaS platform with agency-oriented workflows, allowing brands and internal teams to manage influencer campaigns through a centralized system.

> 🚧 **Project status:** Active development

---

## Overview

ST.MARIA is being developed as a full-stack platform for influencer marketing agencies and brands.

The system is designed around three main actors:

- **Brands** — create and manage campaigns.
- **Creators** — manage their profiles, social accounts and collaborations.
- **ST.MARIA Staff** — manage campaigns, creators, metrics and internal operations.

The platform is designed to support the complete campaign lifecycle while keeping agency operations and financial management separated from creator collaboration workflows.

---

## Main Features

### Authentication & Authorization

- User registration and login
- Role-based access control
- Secure session management
- HTTP-only authentication cookies
- Password hashing with Argon2id
- Protected API routes
- Staff and brand-specific permissions

### Campaign Management

- Campaign creation and management
- Campaign budgets
- Campaign objectives and categories
- Platform selection
- Campaign dates
- Creator collaborations
- Creator fees
- Collaboration status tracking

### Creator Management

- Creator profiles
- Social media platforms
- Followers and engagement metrics
- Creator categories
- Creator locations
- Collaboration history

### Creator Analytics

The platform includes several internal scoring systems designed to help evaluate creators.

#### Trust Score

A composite score based on several factors including:

- Audience quality
- Engagement
- Historical evolution
- Campaign history
- Deliverable performance
- Reliability
- Risk signals

#### Audience Quality

Evaluates available creator metrics such as:

- Engagement quality
- View efficiency
- Reach efficiency
- Interaction quality
- Historical consistency

#### Risk Analysis

The system identifies potential risk signals such as:

- Abnormally low engagement
- Unusual audience growth
- Significant audience drops
- Abnormal engagement changes
- Lack of verified metrics

These signals are intended as decision-support indicators and are not presented as definitive fraud detection.

### Matching Engine

ST.MARIA includes a creator recommendation engine that ranks creators according to their compatibility with a campaign.

The matching system considers factors such as:

- Campaign category
- Social platform compatibility
- Engagement
- Audience quality
- Trust Score
- Risk signals

The result is a ranked list of recommended creators for each campaign.

---

## Architecture

ST.MARIA
│
├── Frontend
│   ├── React
│   ├── Vite
│   └── Tailwind CSS
│
├── Backend
│   ├── Node.js
│   ├── TypeScript
│   └── Express
│
├── Database
│   ├── PostgreSQL
│   └── Prisma ORM
│
└── Infrastructure
    ├── Docker
    └── Docker Compose

## Tech Stack
 ### Frontend
    React
    Vite
    Tailwind CSS
    Backend
    Node.js
    TypeScript
    Express
 ### Database
    PostgreSQL
    Prisma ORM
 ### Security
    Argon2id password hashing
    HTTP-only cookies
    Server-side sessions
    Role-based authorization
    Protected API endpoints
    Audit logging
 ### Development
    Docker
    Docker Compose
    Git
    GitHub
## Project Structure
stMariaAgency/
│
├── src/
│   ├── components/
│   ├── context/
│   ├── lib/
│   └── pages/
│
├── server/
│   ├── src/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   └── lib/
│   │
│   └── prisma/
│
├── public/
│
├── package.json
├── vite.config.js
└── README.md

## Backend Services

The backend is organized into independent services to separate business logic from HTTP routes.

Current services include:

Authentication
Campaign management
Creator management
Creator matching
Trust Score calculation
Audience Quality analysis
Creator risk analysis
Deliverable management

This structure allows the platform to evolve without placing the complete business logic inside Express route handlers.

## Security

Security is considered a core part of the platform architecture.

Current measures include:

Argon2id password hashing
HTTP-only session cookies
Server-side session storage
Role-based authorization
Protected backend routes
Audit logging
Environment variables for sensitive configuration
Separation between frontend and backend

No credentials, API keys or production secrets are included in the repository.

## Development Status

ST.MARIA is an active development project.

 ### Implemented
    Authentication
    User roles
    Brand management
    Creator management
    Campaign management
    Collaboration management
    Deliverables
    Creator metrics
    Historical metrics
    Trust Score
    Audience Quality Score
    Risk analysis
    Matching Engine
    Internal staff dashboard
 ### In development
    Advanced campaign workflows
    Creator selection workflows
    Social platform integrations
    Automated metrics collection
    Payment infrastructure
    Advanced analytics
    Production infrastructure
## Roadmap
Future development includes:

    Social media API integrations
    Automated creator metrics
    Advanced creator filtering
    Campaign optimization
    Creator selection workflows
    Payment processing
    Financial reporting
    Notifications
    File management
    Advanced analytics
    Production deployment

## Project Goals

The main objective of ST.MARIA is to combine software engineering, data analysis and influencer marketing into a scalable platform.

The project focuses on:

Full-stack software development
Secure application architecture
Data-driven creator evaluation
Recommendation systems
Role-based business workflows
Scalable backend architecture

## Disclaimer

ST.MARIA is an independent project currently under active development.

Some features, integrations and production infrastructure are not yet implemented.

The scoring and risk-analysis systems are internal decision-support mechanisms and should not be interpreted as definitive assessments of creator authenticity or fraud.

## Author

Vicente Ayarza

Computer Engineer
MSc in Cybersecurity