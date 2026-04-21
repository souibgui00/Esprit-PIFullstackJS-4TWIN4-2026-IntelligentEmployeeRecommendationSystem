# Intelligent Employee Recommendation System

AI-powered platform for matching employees to internal activities, training opportunities, and assignments using profile data, skills, and NLP-assisted scoring.

## Overview

This repository contains a full-stack recommendation platform with three main services:

- Backend API (NestJS + MongoDB)
- Frontend web app (React + Vite)
- NLP microservice (FastAPI + Sentence Transformers + Random Forest)

The system supports role-based workflows (Admin, HR, Manager, Employee), recommendation pipelines, CV/skills extraction, and real-time notifications.

## Features

- JWT authentication with refresh tokens
- Optional Google OAuth integration
- Role-based access control (Admin/HR/Manager/Employee)
- Activity lifecycle and employee recommendation workflows
- AI skill extraction from activity descriptions
- Hybrid scoring using semantic matching + ML model
- Sentiment analysis endpoint
- CV and avatar upload handling
- Real-time notifications via Socket.IO

## Tech Stack

### Frontend

- React 18
- Vite
- React Router
- Tailwind ecosystem
- Socket.IO Client

### Backend

- NestJS
- Mongoose (MongoDB)
- Passport/JWT
- Socket.IO
- Nodemailer
- Cloudinary

### NLP Service

- FastAPI
- sentence-transformers
- scikit-learn
- pandas, numpy, joblib

## Prerequisites

- Node.js 20+
- npm 10+
- Python 3.10+
- MongoDB (Atlas or local)

