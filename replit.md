# Diamond Dulceria

A luxury, mobile-first e-commerce website for Diamond Dulceria (Estd. 2025), a premium artisan confections brand.

## Overview
- **Purpose:** Online ordering system for artisan confections
- **Payment:** Pay on Pickup + Stripe online payment
- **Design:** Deep Cocoa Brown (#3D2B1F) and Soft Rose Pink (#F4C2C2)

## Features
- Split-screen entrance animation
- Dynamic product catalog (loaded from database)
- Online checkout with order form
- Stripe payment integration
- Admin CRM dashboard at `/dashboard` route
- Status change email notifications to customers
- Email notification system via Resend API

## Architecture
- **Frontend:** React + Vite + Tailwind CSS + Framer Motion
- **Backend:** Express.js
- **Database:** PostgreSQL with Drizzle ORM
- **Email:** Resend API

## Key Routes
- `/` - Main store page (products dynamically loaded from database)
- `/dashboard` - Admin CRM dashboard

## Admin Dashboard Features
- Order management (view, update status, add notes)
- Product management (add, edit, delete products)
- Customer contacts (view all customers, email directly)
- Custom orders (approve/decline, send quotes)
- Analytics (revenue graphs, order status, category breakdown)
- 15-second auto-sync with new order popup alerts

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `ADMIN_EMAIL` - Admin login email (dymonlhf@gmail.com)
- `ADMIN_PASSWORD` - Admin login password
- `RESEND_API_KEY` - Resend API key for email notifications

## Email Notifications
The email notification system uses Resend for sending beautiful HTML emails:
- Order confirmation sent to customers
- Order notifications sent to admin
- **Status change emails** - Customers receive an email whenever their order status changes (Pending, Paid, Ready, Completed, Cancelled)
- Pickup instructions included in "Ready for Pickup" emails
- All orders visible in `/dashboard`

## Product Sync
- Products are stored in PostgreSQL database
- Main website fetches products from `/api/products` endpoint
- Dashboard can add/edit/delete products in real-time
- "Import Products" button seeds default products into database
- Changes in dashboard instantly reflect on the live website

## Recent Changes (Jan 2026)
- Dynamic product loading from database to main site
- Status change email notifications to customers
- Seed products endpoint for initial setup
- Import Products button in dashboard
- Admin authentication via environment variables

## User Preferences
- Luxury aesthetic with gold accents (#D4AF37)
- Mobile-first design approach
- Pill-shaped buttons
- Alabaster product cards
