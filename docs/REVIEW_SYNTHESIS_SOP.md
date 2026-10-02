# M&M Junk Removal: Review Synthesis & Technical Vector SOP (Pillar 3)

This Standard Operating Procedure (SOP) operationalizes **Pillar 3: Grounded Social Proof & Review Synthesis Vectors** for M&M Junk Removal (`www.mmjunk.com`).

---

## 1. Post-Service Review Collection Prompt (SMS / Email)

Send this message within 30–60 minutes following completion of a hauling job. This explicitly prompts the customer to mention the key operational vectors (service type, city/neighborhood, and crew handling) rather than generic feedback:

### SMS Prompt Template
> "Hi [Customer Name], thank you for choosing M&M Junk Removal today! Martin here—could you do us a quick favor and leave a brief review on Google?
> 
> Could you mention:
> 1. The specific items we hauled (e.g., hot tub, sectional couch, estate cleanout, yard debris)
> 2. Your city or neighborhood (e.g., Federal Way, Lea Hill Auburn, North End Tacoma)
> 3. How our crew handled the heavy lifting and cleanup?
> 
> Review Link: [Google Review URL]
> 
> We truly appreciate your support of our local independent family business!"

---

## 2. Technical Owner Response SOP

Modern generative search engines (ChatGPT Search, Google AI Overviews, Perplexity) cross-encode review text and business replies to verify operational capabilities.

**Rule:** Never post a generic *"Thanks for the 5 stars!"* reply. Always inject missing secondary vectors: vehicle specifications, tonnage/volume, municipal destination, and local neighborhood names.

### Scenario A: Generic 5-Star ("Great service, very fast!")
> **Owner Reply:**  
> "Thank you for choosing M&M Junk Removal, [Customer Name]! Our two-technician crew was glad to assist with your [specific item, e.g., 4-piece sectional sofa and box springs] in [City/Neighborhood, e.g., Federal Way near Twin Lakes]. We made sure our 16-foot box truck arrived on schedule and delivered the usable pieces to local charity donation partners before processing the rest. Reach out anytime you need cleanout services!"

### Scenario B: Hot Tub or Shed Demolition
> **Owner Reply:**  
> "Thank you, [Customer Name]! Hot tub demolitions require precision and proper equipment. Our team was happy to safely disconnect the wiring, cut down the jacuzzi shell, and haul away all debris from your [City, e.g., Edgewood] patio without touching the surrounding landscaping. Appreciate your recommendation!"

### Scenario C: Commercial Remodel Debris / Contractor
> **Owner Reply:**  
> "We appreciate your partnership on this project, [Customer Name]! Handling heavy construction debris like drywall, tile, and framing lumber requires high-payload capability. Our commercial box truck (rated up to 4.5 tons) was glad to keep your [City, e.g., Kent Valley] jobsite clean and haul directly to the regional transfer facility. Looking forward to your next renovation phase!"

---

## 3. Site Micro-Case Study Schema Standard

Every micro-case study featured on `www.mmjunk.com` and local landing pages must carry structured `Review` and `ItemReviewed` JSON-LD schema:
```json
{
  "@type": "Review",
  "author": {
    "@type": "Person",
    "name": "Customer Name"
  },
  "datePublished": "2026-08-15",
  "reviewBody": "Detailed customer review mentioning exact service and city...",
  "reviewRating": {
    "@type": "Rating",
    "ratingValue": "5",
    "bestRating": "5"
  },
  "itemReviewed": {
    "@type": "Service",
    "name": "Specific Service (e.g. Hot Tub Demolition & Hauling)",
    "provider": { "@id": "https://www.mmjunk.com/#business" }
  }
}
```
