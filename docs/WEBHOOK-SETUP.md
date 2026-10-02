# Google Business Profile Reviews Webhook Integration Guide

This guide explains how to connect your **Google Business Profile (GBP)** to the M&M Junk Removal website webhook endpoint so that new verified reviews are automatically ingested, qualified by Google's recency parameters, and published with direct verification links.

---

## 1. Webhook Endpoint Specifications

* **Endpoint URL:** `https://www.mmjunk.com/api/webhook-reviews`
* **HTTP Method:** `POST` (Supports `GET` for health/status checks)
* **Headers:**
  * `Content-Type: application/json`
  * `x-webhook-secret: <YOUR_SECRET_TOKEN>` (Optional, configured in Vercel environment variables)

### Sample JSON Payload:
```json
{
  "name": "Sarah Jenkins",
  "rating": 5,
  "text": "Martin came out to Federal Way within two hours of my request. Quick, efficient hot tub cut and haul away. 5-star service!",
  "createTime": "2026-10-01T18:30:00Z",
  "exactReviewUrl": "https://search.google.com/local/reviews?placeid=ChIJAcpZtwpXkFQRGSpNEcXWFt4"
}
```

---

## 2. Connecting via Zapier (No-Code, Recommended)

1. **Trigger:**
   * App: **Google My Business** (Google Business Profile)
   * Event: **New Review**
   * Account: Select your Google Business Profile account managing *M&M Junk Removal*.
2. **Action:**
   * App: **Webhooks by Zapier**
   * Action Event: **POST**
   * URL: `https://www.mmjunk.com/api/webhook-reviews`
   * Payload Type: `json`
   * Data Mapping:
     * `name` &rarr; `Reviewer Display Name`
     * `rating` &rarr; `Star Rating`
     * `text` &rarr; `Comment`
     * `createTime` &rarr; `Create Time`
     * `exactReviewUrl` &rarr; `Review URL` (or leave blank to use the canonical Place Reviews URL)
   * Headers:
     * `x-webhook-secret`: (Your secret token, if configured)
3. **Test & Turn On Zap:**
   * Send test data; you will receive `{ success: true, recencyStatus: "QUALIFIED_RECENT_GOOGLE_REVIEW" }`.

---

## 3. Connecting via Make.com (Integromat)

1. Create a Scenario with **Google My Business &gt; Watch Reviews**.
2. Add an **HTTP &gt; Make a request** module:
   * **URL:** `https://www.mmjunk.com/api/webhook-reviews`
   * **Method:** `POST`
   * **Body Type:** `Raw (application/json)`
   * **Content:**
     ```json
     {
       "name": "{{1.reviewer.displayName}}",
       "rating": "{{1.starRating}}",
       "text": "{{1.comment}}",
       "createTime": "{{1.createTime}}",
       "exactReviewUrl": "{{1.reviewUrl}}"
     }
     ```
3. Activate the scenario to run on your desired schedule (e.g. every 15 minutes or hourly).

---

## 4. Google 90-Day Recency Qualification Logic

The webhook evaluates incoming reviews against Google's local SEO freshness curve:
* **Freshness Parameter:** Reviews published within **<= 90 days** are tagged with `"recencyQualified": true`.
* **Stale Reviews:** Any review older than 90 days is saved but tagged as `"recencyQualified": false` to preserve the verified freshness of the website's front-facing reviews section.

---

## 5. Automated GitOps Deployment (Optional)

To enable automatic Git commits and live Vercel deployments when a new review arrives:
1. Go to your **Vercel Dashboard &gt; Project Settings &gt; Environment Variables**.
2. Add:
   * `GITHUB_TOKEN`: A GitHub Personal Access Token (PAT) with `repo` write permissions for `Martinsilch/mmjunk-com`.
   * `REVIEWS_WEBHOOK_SECRET`: A secure random passphrase (e.g., `mmjunk-gmb-secret-2026`).
3. Whenever the webhook runs, it commits the new review to `assets/reviews.json` on `main`, automatically triggering a clean Vercel static rebuild.
