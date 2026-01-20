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
- Order management (view, update status, add notes, delete)
- Product management (add, edit, delete, **direct image uploads**, category grouping)
- **Image uploads** - Upload images directly from computer (stored in /uploads/products)
- **Categories management** (add, edit, delete, reorder categories)
- **Promo Codes management** (add, edit, delete, toggle active/inactive)
- Customer contacts (view all customers, email directly)
- Custom orders (approve/decline, send quotes)
- Analytics (revenue graphs, order status, category breakdown)
- Settings tab for editable site headers
- 15-second auto-sync with new order popup alerts

## Promo Code System
- **Admin can create promo codes** with percentage or fixed amount discounts
- **Promo codes table** stores code, discount type, value, and active status
- **Customer checkout** includes promo code input field
- **Server-side validation** ensures promo codes are valid and active
- **Stripe integration** charges the discounted total, not the original price
- **Discount metadata** stored in Stripe payment intent for auditing

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

## Dynamic Content System
- **Categories table** stores navigation items and section headers
- **Settings table** stores hero text, site title, and footer text
- **Navbar** automatically generated from categories in database
- **Section headers** (titles and descriptions) pulled from categories
- **Hero section** uses settings for title, subtitle, tagline, and description
- Changes in Admin Dashboard → Categories tab reflect instantly on live site
- Changes in Admin Dashboard → Settings tab reflect instantly on live site
- "Import Default" button seeds default categories (Truffles, Cookies, Seasonal, Custom)

### Important: Initial Setup
- Admin must click "Import Default" in Categories tab to seed initial categories
- Products have a `category` field (singular: "truffle", "cookie", etc.)
- Category slugs (plural: "truffles", "cookies", etc.) are matched automatically

## Recent Changes (Jan 2026)
- **Promo code system** - Admin can create discount codes, customers can apply at checkout
- Dynamic categories system for navbar and section headers
- Categories management tab in admin dashboard
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
