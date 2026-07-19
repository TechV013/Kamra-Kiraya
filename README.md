<div align="center">

# 🏠 कमरा किराया (Kamra Kiraya)

### A Production-Ready Student Room Booking Platform

Built with **Next.js 15 • React 19 • TypeScript • Prisma • PostgreSQL • Docker • GitHub Actions**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)]()
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)]()
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)]()
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791?logo=postgresql)]()
[![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?logo=docker)]()

</div>

---

# 📖 Overview

**Kamra Kiraya** is a full-stack student accommodation platform developed to simplify the process of finding verified rental rooms near colleges and universities.

Unlike traditional rental websites, this platform is designed specifically for students, providing a secure, user-friendly, and scalable solution with dedicated dashboards for students, property owners, and administrators.

The project was built as my final-year engineering project and follows production-oriented software engineering practices including authentication, authorization, CI/CD, containerization, database design, and secure API development.

---

# ✨ Features

## 👨‍🎓 Student

- 🔍 Search verified rooms
- 🎯 Advanced filters
- ❤️ Wishlist
- 🤖 AI-powered room recommendations
- 💬 Chat with property owners
- 🏠 Book rooms
- 💳 Payment tracking
- ⭐ Reviews & Ratings
- 🔔 Notifications
- 📊 Personal dashboard

---

## 🏠 Property Owner

- Add rooms
- Update listings
- Delete rooms
- Upload room images
- Booking management
- Payment monitoring
- Owner dashboard
- Verification workflow

---

## 👨‍💼 Admin

- User management
- Property approval
- Booking management
- Analytics dashboard
- Commission settings
- Platform monitoring
- Owner verification
- Activity management

---

# 🛠 Tech Stack

## Frontend

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- ShadCN UI
- Framer Motion

---

## Backend

- Next.js API Routes
- Prisma ORM
- REST APIs

---

## Database

- PostgreSQL

---

## Authentication & Security

- JWT Authentication
- Role-Based Access Control (RBAC)
- bcrypt Password Hashing
- Secure Cookies
- Zod Validation
- Protected API Routes

---

## DevOps

- Docker
- GitHub Actions
- CI/CD Pipeline
- Environment Configuration

---

## AI Features

- AI Room Recommendation System
- Smart Search Assistance
- AI Chat Integration

---

# 📸 Screenshots

## Home Page

> Add screenshot here

```
<img width="1675" height="970" alt="Screenshot 2026-06-18 120740" src="https://github.com/user-attachments/assets/3db8fd62-8a5a-4046-a6df-657d6cb6f258" />

```

---

## Student Dashboard

```
screenshots/student-dashboard.png
```

---

## Owner Dashboard

```
screenshots/owner-dashboard.png
```

---

## Admin Dashboard

```
screenshots/admin-dashboard.png
```

---

## Room Booking

```
screenshots/booking.png
```

---

## AI Recommendation

```
screenshots/ai-recommendation.png
```

---

# 🏗 System Architecture

```
                   Browser
                       │
                       ▼
               Next.js Frontend
                       │
        ┌──────────────┴──────────────┐
        ▼                             ▼
 Authentication                 REST APIs
        │                             │
        └──────────────┬──────────────┘
                       ▼
                  Prisma ORM
                       │
                       ▼
                PostgreSQL Database
                       │
                       ▼
                Cloud Deployment
```

---

# 🗄 Database Design

Core Models

- User
- Room
- Booking
- Payment
- Review
- Wishlist
- Notification

Relationships

```
User
 ├── Rooms
 ├── Bookings
 ├── Wishlist
 ├── Reviews
 └── Notifications

Room
 ├── Booking
 ├── Review
 └── Owner

Booking
 └── Payment
```

---

# 🔐 Security Features

✔ JWT Authentication

✔ Role-Based Access Control

✔ Password Hashing (bcrypt)

✔ Secure HTTP-only Cookies

✔ Protected API Routes

✔ Input Validation

✔ Server-side Authorization

✔ Environment Variable Management

---

# 📂 Project Structure

```
kamra-kiraya

├── app
├── components
├── lib
├── prisma
├── public
├── middleware.ts
├── Dockerfile
├── docker-compose.yml
├── package.json
└── README.md
```

---

# ⚙ Installation

Clone Repository

```bash
git clone https://github.com/yourusername/kamra-kiraya.git
```

Move into Project

```bash
cd kamra-kiraya
```

Install Dependencies

```bash
npm install
```

---

# Environment Variables

Create a `.env` file

```env
DATABASE_URL=

JWT_SECRET=

NEXT_PUBLIC_API_URL=

GEMINI_API_KEY=
```

---

# Prisma

Generate Client

```bash
npx prisma generate
```

Run Migration

```bash
npx prisma migrate deploy
```

---

# Run Project

```bash
npm run dev
```

Open

```
http://localhost:3000
```

---

# 🐳 Docker

Build

```bash
docker build -t kamra-kiraya .
```

Run

```bash
docker run -p 3000:3000 kamra-kiraya
```

---

# 🚀 Deployment

This project is designed to be deployed using:

- Docker
- Render
- Railway
- Vercel
- GitHub Actions CI/CD

---

# 🔄 CI/CD Pipeline

```
Developer

      │

      ▼

GitHub Repository

      │

      ▼

GitHub Actions

      │

      ▼

Install Dependencies

      │

      ▼

Prisma Generate

      │

      ▼

Build Application

      │

      ▼

Deploy
```

---

# 🧪 Testing

Current Testing

- Functional Testing
- Authentication Testing
- Role-Based Access Testing
- API Testing
- Responsive UI Testing

Planned Testing

- Load Testing using k6
- Performance Testing
- Security Testing
- User Acceptance Testing (UAT)

---

# 📈 Future Enhancements

- Kubernetes Deployment
- Redis Caching
- ElasticSearch
- Payment Gateway Integration
- Email Notifications
- Push Notifications
- Monitoring Dashboard
- AI-based Price Prediction
- Recommendation Engine Improvements

---

# 🌐 Live Demo

**Application**

> https://your-live-demo-url.com

---

# 📄 Documentation

Future documentation includes:

- API Documentation
- System Design
- Database Schema
- Architecture Diagram
- Testing Report

---

# 👨‍💻 Author

## Vishal Jangir

B.Tech Computer Science Engineering

Amity University Rajasthan

- 💼 LinkedIn: https://linkedin.com/in/your-profile
- 💻 GitHub: https://github.com/yourusername
- 🌐 Portfolio: https://yourportfolio.com

---

# ⭐ Support

If you found this project useful, consider giving it a ⭐ on GitHub.

It motivates me to continue building impactful software and sharing my learning journey with the community.

---

<div align="center">

**Building software that solves real-world problems.**

Made with ❤️ by **Vishal Jangir**

</div>
