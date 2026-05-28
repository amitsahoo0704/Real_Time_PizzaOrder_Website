<img width="1901" height="1075" alt="Real_Time_Pizza" src="https://github.com/user-attachments/assets/01d82910-a5c2-40e0-8a92-f62aecd888fe" />
# Real-Time Pizza Ordering System

Lightweight Node/Express pizza ordering app with session cart, admin pages, and real-time notifications.

## Quick start

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in the project root with the minimum variables (example):

```
MONGO_CONNECTION_URL=<your-mongo-uri>
COOKIE_SECRET=some_secret
SMTP_USER=you@example.com
SMTP_PASS=your_smtp_password
PORT=3000
```

3. Seed menu data (optional):

```bash
node -r dotenv/config seeds/seedMenus.js
```

4. Run the dev server:

```bash
npm run dev
```

The app will start on `PORT` (defaults to 3000) — if 3000 is in use it will try the next port.

## Features

- Session-backed shopping cart with per-item quantities and +/- controls
- Cash-on-delivery (COD) checkout flow (Stripe client disabled by default)
- Promo/discount codes (server-side): `PIZZA10` (10%), `WELCOME20` (20%), `FESTIVE30` (30%)
- Dismissible promo banner and hero poster to attract users
- Accessible image carousel with aria-live announcements and keyboard navigation
- Simple admin CRUD for menu items and real-time order notifications
- Theme support: `theme-dominos` and `theme-blinkit` via CSS variables

## Promo codes

Apply codes on the cart page (`/cart`). Built-in codes:

- `PIZZA10` — 10% off
- `WELCOME20` — 20% off
- `FESTIVE30` — 30% off

Promo codes are defined in `app/http/controllers/customers/cartController.js` — you can move them to a DB or config file if you want admin-editable promos.

## Theming

Two example themes are available in `public/css/app.css` as classes: `theme-dominos` and `theme-blinkit`.
To preview Blinkit colors add the class to the `<body>` tag in [resources/views/layout.ejs](resources/views/layout.ejs#L1):

```html
<body class="theme-blinkit">
```

## Seeding and images

- The project includes `menus.json` and a seeder at `seeds/seedMenus.js`.
- Menu items will map to local images in `public/img/` using a simple deterministic mapping.

## Notes & security

- This repository currently uses environment variables for secrets. Do not commit real credentials to Git — keep `.env` out of version control.
- The example email sender in `routes/web.js` uses a hard-coded credential in the example code; replace it with `SMTP_USER`/`SMTP_PASS` and test with a safe SMTP provider (Mailtrap, SendGrid sandbox, or a test Gmail account with app password).
- Stripe support is present but disabled for the current COD-only flow. Re-enable Stripe and add keys in `.env` to accept card payments.
