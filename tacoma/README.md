# M&M Junk Removal - Tacoma Landing Page

Dedicated high-converting Google Ads landing page designed for the **Junk Removal - Tacoma** Ad Group.

## 🎯 Google Ads Alignment & Assets
- **Ad Group**: Junk Removal - Tacoma
- **Target Area**: Tacoma, WA & Pierce County
- **Core Keywords**: `junk removal`, `junk removal tacoma`, `junk removal tacoma wa`, `junk haulers tacoma`
- **Display Path**: `www.mamhadjunkremoval.com / Junk-Removal / Tacoma`
- **Phone**: (253) 777-8718
- **Online Booking**: `https://amzy.me/?utm_content=4` (Amzy 30-sec scheduling)

### Sitelinks Integrated:
1. **Online Scheduling**: Booking in 30 Sec. or LESS? · Choose Your Own Time
2. **Same Day Service**: Call before noon. · Must call in for Same Day Service.
3. **Rates & Pricing**: Watch Pricing Video · Call for Specific Costs.
4. **Availability**: Use booking portal for Availability · Booking for Future day.
5. **Free Quote**: Estimate are free. · Call for over the phone.
6. **Questions?**: Fast, Efficient, & Affordable · Please call for more information.

---

## 🚀 How to Deploy as a Separate Project in Vercel

### Option 1: Deploy Directly from Existing Repo (`Martinsilch/mamhad-site`)
1. In your **Vercel Dashboard**, click **"Add New..."** &rarr; **"Project"**.
2. Select your existing repository **`mamhad-site`** (or import it if not already connected).
3. In the project configuration screen:
   - **Project Name**: Set to `mamhad-tacoma` (or `junk-removal-tacoma`).
   - **Root Directory**: Click **Edit** and choose or type `tacoma`.
   - Leave Framework Preset as **Other** (Static HTML).
4. Click **Deploy**.
5. Vercel will build and deploy the landing page to a dedicated URL (e.g., `https://mamhad-tacoma.vercel.app`), serving `tacoma/index.html` at the root `/`!
6. (Optional) In **Settings &rarr; Domains**, connect your custom domain/subdomain (e.g. `tacoma.mamhadjunkremoval.com` or `www.mamhadjunkremoval.com/junk-removal/tacoma`).

### Option 2: Deploy from a Separate Repository
If you prefer a standalone GitHub repository:
1. Initialize a new repo in the `tacoma` directory:
   ```bash
   cd tacoma
   git init
   git add .
   git commit -m "Initial commit for Tacoma Junk Removal landing page"
   git remote add origin https://github.com/Martinsilch/mamhad-tacoma.git
   git push -u origin main
   ```
2. In Vercel, import `mamhad-tacoma` as a new project with root `/`.
