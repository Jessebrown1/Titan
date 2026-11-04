# TITAN MOTORS

Premium showroom website and inventory dashboard for TITAN MOTORS, built with **React + plain CSS**.

- **Public site:** home (hero, collection, about, why choose us, contact), vehicle inventory with search, filters and sorting, vehicle detail pages with photo gallery and WhatsApp / phone / email enquiry, About and Contact pages.
- **Rentals:** a Rent a Car page, daily rates, date-based rental requests with live estimates and double-booking protection. No online payment.
- **Admin dashboard (`/admin`):** secure sign-in, live overview with charts and a to-do list, add / edit / delete vehicles, photo upload and ordering, availability and featured toggles, rental bookings, and an enquiry inbox.
- **Backend:** Supabase (Postgres + Auth + Storage) with Row Level Security.

| Stack | |
|---|---|
| UI | React 18, React Router 6, plain CSS (design tokens in `src/styles/tokens.css`) |
| Motion | Framer Motion + Lenis smooth scrolling (both respect the "reduce motion" setting) |
| Themes | Light + dark, follows the device setting, toggle in the navbar |
| Icons | Lucide React |
| Data | Supabase JS v2 (admin only); the public site uses a small `fetch` helper with caching |
| Build | Vite 5 |

---

## 1. Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:5173.

With no `.env` file the site runs in **demo mode**: it shows 10 sample vehicles popular in Ghana, the contact form tells visitors it isn't connected yet and offers email/WhatsApp instead (once those are configured), and `/admin` shows setup instructions. Nothing pretends to be connected.

## 2. Connect Supabase (database, login, photo storage)

**Cost: free.** Supabase's free plan needs no credit card and comfortably covers a dealership site: 500 MB database (tens of thousands of vehicles/enquiries), 1 GB photo storage (roughly 2,000–4,000 resized photos), 5 GB bandwidth/month and 50,000 monthly users. Free projects pause after 7 days with no activity — open the dashboard to resume, or upgrade (Pro, $25/month) once the site is live and busy.

1. Create a free project at [supabase.com](https://supabase.com).
2. **SQL Editor → New query** → paste the whole of [`supabase/schema.sql`](supabase/schema.sql) → **Run**.
   This creates the `vehicles`, `enquiries` and `admins` tables, all security policies, the public `vehicle-images` storage bucket, and enables Realtime for vehicles.
3. *(Optional)* run [`supabase/seed.sql`](supabase/seed.sql) to load the demo vehicles. They're flagged `is_demo`; remove them later with
   `delete from public.vehicles where is_demo;`
4. **Project Settings → API**: copy the *Project URL* and *anon public* key.
5. Copy the env template and fill it in:
   ```bash
   cp .env.example .env
   ```
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```
6. Restart `npm run dev`.

> Only the **anon** key goes in the frontend. Never put the `service_role` key in `.env` for this app.

### Create an administrator

1. **Authentication → Providers → Email**: keep Email enabled. Then **Authentication → Sign In / Up**: turn **off** "Allow new users to sign up" so nobody can register themselves.
2. **Authentication → Users → Add user → Create new user**: enter the admin's email and a strong password (tick *Auto Confirm User*).
3. **SQL Editor**, authorise that user:
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'admin@yourcompany.com';
   ```
4. Sign in at `/admin/login`.

To revoke access: `delete from public.admins where user_id = (select id from auth.users where email = '...');`

### How security works

- The browser only ever has the public anon key.
- Row Level Security on every table:
  - `vehicles` — anyone can read; only users in `admins` can insert / update / delete.
  - `enquiries` — anyone can **submit**; only admins can read, update or delete.
  - `storage: vehicle-images` — public read; only admins can upload / replace / delete.
- Signing in with a valid account that isn't in `admins` is rejected by the app *and* blocked by the database.

## 3. Company details

All contact details are environment variables, so no placeholder numbers ever appear on the site. Anything left blank shows "To be confirmed" and its button is hidden.

| Variable | Example | Used for |
|---|---|---|
| `VITE_COMPANY_PHONE` | `+233 24 123 4567` | Call buttons (`tel:`) |
| `VITE_COMPANY_WHATSAPP` | blank = same as phone | "Enquire about this vehicle" opens WhatsApp with a pre-filled message. Local Ghana numbers (024…) are converted to 233… automatically |
| `VITE_COMPANY_EMAIL` | `sales@titanmotors.com` | Email buttons (`mailto:`) |
| `VITE_COMPANY_ADDRESS` | `12 Example Road, Accra` | Location + Google Maps link |
| `VITE_COMPANY_HOURS` | `Mon–Sat 9:00–18:00` | Contact section |
| `VITE_SOCIAL_INSTAGRAM` / `_FACEBOOK` / `_X` / `_YOUTUBE` | full URLs | Footer icons |
| `VITE_CURRENCY` / `VITE_LOCALE` | `GHS` / `en-GH` (shows GH₵) | Price formatting; the inventory price filter scales to your prices automatically |
| `VITE_DISTANCE_UNIT` | `km` (default) or `mi` | Mileage |
| `VITE_SITE_URL` | `https://titanmotors.com` | Canonical URLs |

If WhatsApp isn't set, "Enquire about this vehicle" opens the contact form pre-filled with that vehicle instead.

## 4. Managing inventory

- **Add vehicle** — fill in the details, drop in photos (the first is the main image; reorder with the arrows or ★). Photos are resized in the browser to max 2000px WebP before upload.
- **Availability** — Available / Reserved / Sold, changeable inline from the vehicle list. Sold vehicles stay visible (greyed, sorted last) unless visitors tick "Hide sold".
- **Featured** — ★ in the list. Featured vehicles lead the homepage collection; it tops up with the newest available vehicles to show up to six.
- **Price** — leave blank to show "Price on request".
- Changes appear on the public site on the next page load or when a visitor returns to the tab. Pages show the last known list instantly and refresh it in the background.
- Deleting a vehicle also deletes its uploaded photos.

## 5. Rentals

Each vehicle is either for sale or for rent, never both (Admin → edit a vehicle → *Listing*). Sale cars appear on **Our Vehicles** (`/vehicles`) and the homepage collection; rental cars appear only on **Rent a Car** (`/rent`) and need a daily rate.

Customers pick dates, choose self-drive or a driver, see an estimate and send a request. **Nothing is paid online.** Requests appear in **Admin → Rentals**, where you confirm, decline or complete them. Confirming blocks those dates for that car on the website, and the admin warns about clashes. Customers see only the blocked dates, never who booked. Driver costs, deposits and rental terms are agreed directly with the customer.

## 6. Enquiries

Contact form submissions are stored in the `enquiries` table and appear under **Admin → Enquiries**, with one-click email / call / WhatsApp reply buttons and a status of New → Contacted → Resolved.

**Email notifications (optional):** Supabase can email you on each new enquiry via **Database → Webhooks** (on `INSERT` into `enquiries`) pointing at an email service such as Resend, Postmark or Zapier. This needs your own email-service account, so it isn't wired in by default.

**Spam:** the form has validation and a hidden honeypot field, and the database enforces length/format limits. For high traffic, add Supabase's CAPTCHA protection or an Edge Function with rate limiting.

## 7. Deploy

```bash
npm run build      # outputs dist/
```

- **Vercel:** import the repo, framework *Vite*, add the `VITE_*` environment variables, deploy. `vercel.json` handles client-side routes.
- **Netlify:** build command `npm run build`, publish directory `dist`, add the env vars. `public/_redirects` handles client-side routes.
- In Supabase **Authentication → URL Configuration**, set *Site URL* to your live domain.

## 8. Dark mode and animation

- **Theme:** follows the visitor's device setting until they press the sun/moon toggle (navbar, mobile menu bar, admin sidebar); their choice is remembered. Switching plays a circular reveal from the button in browsers that support the View Transitions API. Colours live as tokens in `src/styles/tokens.css` — the dark set is under `:root[data-theme='dark']`.
- **Motion** (`src/components/motion/`): smooth inertia scrolling, letter-by-letter hero headline, cursor parallax and a light sweep across the hero car, counting stats, magnetic buttons, 3D tilt + glare on vehicle cards, clip-path image reveals, a marques marquee and a scroll progress bar. Everything calms down automatically for visitors who enable "reduce motion"; tilt/magnetic/parallax only run on mouse/trackpad devices.

## 9. Performance

- The Supabase library loads only in `/admin`; visitors get about 120 KB of gzipped JavaScript.
- Inventory is cached (memory + localStorage) and refreshed in the background, so pages open instantly.
- Other pages are fetched while the browser is idle. Fonts are self-hosted; the hero has a phone-sized image.
- `npm run dev` is much slower than the real site because it isn't bundled. To judge speed, use `npm run build` then `npm run preview`.

## 10. Replacing demo content

- **Hero image:** `public/images/hero-car.webp` (1600px) and `hero-car-860.webp` (phones) — transparent cut-outs, so the car overlaps the giant headline. Swap in your own transparent WebPs with the same names; keep the car complete in frame.
- **Sample vehicles:** the listings no longer show a Demo label on the site, so replace them before launch. Delete them in `/admin` (or `delete from public.vehicles where is_demo;`). The bundled list in `src/data/demoVehicles.js` is only used when Supabase isn't configured. After editing it, `npm run seed:generate` rebuilds `supabase/seed.sql`.
- **About section photos:** `src/components/sections/About.jsx`.
- **Copy:** each section lives in `src/components/sections/`.

Demo photographs are from [Unsplash](https://unsplash.com) (Unsplash License). Demo prices are illustrative. The hero car is a cut-out of an Unsplash photo; replace it with your own photography before launch.

## Project structure

```
src/
  admin/        dashboard: login, overview, vehicle list/editor, image manager, enquiries
  components/   shared UI (Navbar, Footer, VehicleCard, Gallery, ContactForm, …)
    sections/   homepage sections (Hero, Collection, About, WhyChoose, ContactSection)
  config/       site.js — company details from env vars
  data/         demoVehicles.js — demo content
  components/motion/  SplitText, Magnetic, TiltCard, CountUp, ImageReveal, ScrollProgress
  hooks/        useAuth, useTheme, useSmoothScroll, useVehicles, useAsync, useDocumentMeta
  layouts/      PublicLayout
  lib/          supabase client, formatting, image helpers
  pages/        Home, Vehicles, VehicleDetail, About, Contact, NotFound
  services/     vehicles.js, enquiries.js (public); vehiclesAdmin.js, enquiriesAdmin.js (admin only)
  styles/       tokens.css (light + dark), base.css, layout.css, home.css, inventory.css, motion.css, admin.css
supabase/
  schema.sql    tables, RLS policies, storage bucket
  seed.sql      demo vehicles
```
