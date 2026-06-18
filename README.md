# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## Environment variables

Copy `.env.example` to `.env` and fill in your values:

```sh
cp .env.example .env
```

| Variable | Required | Purpose |
|----------|----------|---------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase anon/public key |
| `VITE_GOOGLE_MAPS_API_KEY` | For Admin address search | Google Places autocomplete |

## Google Maps API setup (address autocomplete)

The Admin **Add/Edit Service** form uses Google Places to suggest addresses and auto-fill latitude/longitude. Without an API key, admins can still type addresses manually and pick a location on the map.

### 1. Create a Google Cloud project

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (or select an existing one).
3. Go to **APIs & Services → Library**.
4. Enable these APIs:
   - **Maps JavaScript API**
   - **Places API** (legacy Places — used by the autocomplete widget)

### 2. Create an API key

1. Go to **APIs & Services → Credentials**.
2. Click **Create credentials → API key**.
3. Copy the key into `.env`:

```env
VITE_GOOGLE_MAPS_API_KEY=AIza...your-key
```

4. Restart the dev server after changing `.env` (`npm run dev`).

### 3. Restrict the key (recommended)

1. Edit the API key in Cloud Console.
2. Under **Application restrictions**, choose:
   - **HTTP referrers** for web dev/production, e.g.:
     - `http://localhost:*`
     - `https://your-production-domain.com/*`
   - Or **Android apps** if you only ship the Capacitor build (use your app package name + SHA-1).
3. Under **API restrictions**, limit to **Maps JavaScript API** and **Places API**.

### 4. Billing

Google Maps Platform requires a billing account. The free monthly credit usually covers light development and small apps. See [Google Maps pricing](https://developers.google.com/maps/billing-and-pricing/pricing).

### 5. Verify it works

1. Sign in as an admin and open **Admin → Add Service**.
2. In the **Address** field, start typing a street or place name.
3. Select a suggestion — the address, map pin, and lat/lng fields should update.

If suggestions do not appear, check the browser console for Google API errors (invalid key, API not enabled, or referrer restriction).

## Operating hours format

Services show **Open** or **Closed** on the home page based on the current time and the `operating_hours` field. The service must also be marked **Active** in Admin.

### Supported formats

| Format | Example |
|--------|---------|
| Weekday range + times | `Mon-Fri 8AM-6PM` |
| Day range + 24h times | `Mon-Sat 8:00-18:00` |
| Every day | `Daily 6AM-10PM` |
| Specific days (comma) | `Mon, Wed, Fri 9AM-5PM` |
| Keywords | `Weekdays 8AM-6PM`, `Weekends 10AM-4PM` |
| Multiple schedules | `Mon-Fri 8AM-6PM; Sat 9AM-1PM` (use `;` between schedules) |
| Always open | `24/7` or `Always open` |

### Tips

- Times can use `8AM`, `8 AM`, `8:30PM`, or `18:00` style.
- Use a **semicolon** (`;`) to add a second schedule (e.g. different Saturday hours).
- Use **commas only for day lists** (`Mon, Wed, Fri`), not between separate schedules.
- If hours are left empty, the service is treated as open whenever it is active.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
