# StayEase - Hotel Booking Platform

StayEase is a full-stack hotel room booking application. Guests can browse rooms, check availability, make bookings and payments, and leave reviews. Hotel owners can register their property, manage room listings, and monitor bookings and revenue.

## Features

### Guests
- Browse featured and available rooms, view room details, amenities, and reviews.
- Check room availability for selected dates and book a stay.
- Pay with Stripe or choose pay-at-hotel.
- View bookings, payment status, and room reviews.
- Receive booking confirmation by email.

### Hotel owners
- Register a hotel and add rooms with photos and amenities.
- Upload room photos through Cloudinary and manage room availability.
- View bookings, payment status, booking totals, and revenue in a dashboard.

### Platform
- Clerk authentication for users and hotel owners.
- Date-overlap checks to prevent booking a room for already-booked dates.
- Stripe webhook integration to update payment status.
- MongoDB persistence for users, hotels, rooms, and bookings.

## Technology

- **Frontend:** React, Vite, Tailwind CSS, React Router, Axios
- **Backend:** Node.js, Express
- **Database:** MongoDB with Mongoose
- **Authentication:** Clerk
- **Payments:** Stripe
- **Image storage:** Cloudinary
- **Email:** Nodemailer with Brevo SMTP

## Prerequisites

- Node.js and npm
- A MongoDB database
- Clerk application credentials
- Cloudinary credentials for room image uploads
- Stripe credentials for online payments
- Brevo SMTP credentials for booking emails

## Setup

Run these commands from the repository root.

### 1. Configure the backend

Create `server/.env` (you can start from `server/.env.example`) and set:

```env
MONGODB_URI=your_mongodb_connection_string
PORT=3000
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
SMTP_USER=your_brevo_smtp_login
SMTP_PASS=your_brevo_smtp_key
SENDER_EMAIL=your_sender_email
CURRENCY=$
```

Configure Clerk webhooks to reach `/api/clerk` and Stripe webhooks to reach `/api/stripe` on your backend. Use the corresponding webhook signing secrets in the environment.

Install dependencies and start the API:

```bash
cd server
npm install
npm run server
```

The API listens on port `3000` by default.

### 2. Configure the frontend

Create `client/.env` (you can start from `client/.env.example`) and set:

```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_BACKEND_URL=http://localhost:3000
VITE_CURRENCY=$
```

Install dependencies and start the development server in a separate terminal:

```bash
cd client
npm install
npm run dev
```

Open the local URL printed by Vite in your terminal.

## Scripts

### Client (`client/`)

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Create a production build |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |

### Server (`server/`)

| Command | Description |
| --- | --- |
| `npm run server` | Start the API with Nodemon |
| `npm start` | Start the API with Node.js |

## Main API routes

All routes are prefixed with `/api`.

| Path | Purpose |
| --- | --- |
| `/rooms` | List available rooms; create, list, and manage owner rooms |
| `/hotels` | Register a hotel |
| `/bookings` | Check availability, create and view bookings, manage reviews, and start Stripe payment |
| `/user` | User profile and role information |
| `/clerk` | Clerk webhook |
| `/stripe` | Stripe webhook |

Some endpoints require a Clerk-authenticated user.

## Project structure

```text
client/   React frontend
server/   Express API, database models, routes, and integrations
```

## Notes

- Keep `.env` files and all secret keys out of version control.
- Stripe and webhook features require valid credentials and publicly reachable webhook endpoints when testing with external services.
