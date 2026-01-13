# Diamond Dulceria

A luxury, mobile-first e-commerce website for Diamond Dulceria (Estd. 2025), a premium artisan confections brand.

## Overview
- **Purpose:** Online ordering system for artisan confections
- **Payment:** Pay on Delivery
- **Design:** Deep Cocoa Brown (#3D2B1F) and Soft Rose Pink (#F4C2C2)

## Features
- Split-screen entrance animation
- Product catalog with 7 items
- Online checkout with order form
- Admin dashboard at `/admin` route
- Email notification system (configured but needs SMTP for production)

## Architecture
- **Frontend:** React + Vite + Tailwind CSS + Framer Motion
- **Backend:** Express.js
- **Database:** PostgreSQL with Drizzle ORM

## Key Routes
- `/` - Main store page
- `/admin` - Order dashboard (shows all orders, revenue stats, customer info)

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `OWNER_EMAIL` - Business owner email for order notifications (yousefasmar2005@gmail.com)

## Email Notifications
The email notification system is built using nodemailer. Currently, order notifications are logged to the server console. To enable actual email delivery:
1. The system is ready to send to the OWNER_EMAIL address
2. SMTP credentials need to be configured for production email delivery
3. All orders are visible in the `/admin` dashboard regardless of email setup

## Recent Changes
- Full-stack upgrade with PostgreSQL database
- Order submission and storage system
- Admin dashboard with real-time order viewing
- Email notification foundation

## User Preferences
- Luxury aesthetic with gold accents (#D4AF37)
- Mobile-first design approach
- Pill-shaped buttons
- Alabaster product cards
