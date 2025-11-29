# Klarnow Dashboard Requirements Document

## Overview

This document outlines the complete dashboard structure, requirements, and specifications for the Klarnow project onboarding system. The dashboard provides a guided experience for clients to submit information for their Launch Kit (3-page site) or Growth Kit (4-6 page funnel with emails).

**Tagline:** Story led campaigns powered by AI. Your answers feed the system.

---

## Top-Level Navigation Structure

The dashboard should have the following top-level navigation items:

### 1. Home
- **Subtitle:** Your project with Klarnow in one place.
- **Content:**
  - Quick status overview
  - Which kit they are on (Launch or Growth)
  - "Next thing to complete" card
  - Project progress indicator

### 2. Launch Kit
- **Subtitle:** 3 page high trust site in 14 days.
- **Visibility:** Show only if user purchased Launch Kit
- **Content:** Launch Kit onboarding flow (6 cards)
- **Hero Text:** "Launch Kit: Klaro will walk you through these steps so we can build your 3 page site in 14 days."

### 3. Growth Kit
- **Subtitle:** 4 to 6 page funnel and emails in 14 days.
- **Visibility:** Show only if user purchased Growth Kit
- **Content:** Growth Kit onboarding flow (7 cards)
- **Hero Text:** "Growth Kit: Klaro will help you set up the pieces we need to build your funnel and emails in 14 days."

### 4. Support
- **Subtitle:** Messages, Looms and updates from the Klarnow team.
- **Content:** Communication hub for support interactions

---

## Launch Kit Specification

Launch Kit uses 4 simple steps to keep it light and approachable.

### Progress Bar

The Launch Kit page should display a simple progress bar showing:

1. Start with the basics
2. Your offer in one look
3. Brand look and feel
4. Clients and proof
5. Voice and vibe
6. Switch on the site

### Card 1: "Start with the basics"

**Subtitle:** Tell us who you are and how to reach you.

**Microcopy Example:**
> "Start with the basics
> 
> This takes less than 5 minutes. It gives us the core details for your project."

**Fields:**
- Business name
- Your name
- Your role
- Contact email
- Phone/WhatsApp
- Social media links
- Current site link

**Field Mappings:**
```
business_name: string
contact_name: string
contact_role: string
contact_email: string
phone_whatsapp: string
social_links: string[] (or JSON)
current_site_url: string
```

---

### Card 2: "Your offer in one look"

**Subtitle:** What you sell and who it is for.

**Microcopy Example:**
> "Your offer in one look
> 
> Describe what you sell, who it's for, and how you deliver it. This helps us craft the right message."

**Fields:**
- What you sell
- Who it is for (target audience)
- What is included
- How you deliver it
- Pricing
- Show prices or not (boolean toggle)

**Field Mappings:**
```
offer_description: text
target_audience: text
whats_included: text
delivery_method: text
pricing: string
show_pricing: boolean
```

---

### Card 3: "Brand look and feel"

**Subtitle:** Logo, colours and real photos that feel like you.

**Microcopy Example:**
> "Brand look and feel
> 
> Share your logo, brand colors, and photos. These visual elements make your site feel authentically you."

**Fields:**
- Logo upload (file upload)
- Brand colours (color picker or hex codes)
- Brand photos (file upload - multiple)
- Example sites (URLs - optional)

**Field Mappings:**
```
logo_url: string (uploaded file path)
brand_colors: string[] (hex codes or JSON)
brand_photos: string[] (uploaded file paths)
example_sites: string[] (URLs)
```

---

### Card 4: "Clients and proof"

**Subtitle:** Who you help and why people trust you.

**Microcopy Example:**
> "Clients and proof
> 
> Help us understand your ideal client and gather the social proof that builds trust."

**Fields:**
- Ideal client description
- Top problems (list)
- Top results (list)
- Testimonials (text area - multiple)
- Review links (URLs)

**Field Mappings:**
```
ideal_client_description: text
top_problems: string[] (list)
top_results: string[] (list)
testimonials: text[] (array of testimonial text)
review_links: string[] (URLs)
```

---

### Card 5: "Voice and vibe"

**Subtitle:** How your site should sound.

**Microcopy Example:**
> "Voice and vibe
> 
> Define the tone and personality for your site. What words capture your voice? What should we avoid?"

**Fields:**
- 3 voice words
- Words or phrases to avoid

**Field Mappings:**
```
voice_words: string[] (exactly 3)
words_to_avoid: string[] (list)
```

---

### Card 6: "Switch on the site"

**Subtitle:** Domain, forms and what we need to launch.

**Microcopy Example:**
> "Switch on the site
> 
> Final step! Give us access details so we can set up your domain, forms, and launch your site."

**Fields:**
- Domain provider
- Existing site platform
- Access details (credentials or notes)
- Email for contact form
- Privacy/terms link

**Field Mappings:**
```
domain_provider: string
existing_site_platform: string
access_details: text (or encrypted credentials)
contact_form_email: string
privacy_terms_link: string
```

---

## Growth Kit Specification

Growth Kit clients can handle a bit more complexity, but the interface should remain clean. Use 7 cards total.

### Progress Bar

The Growth Kit page should display a simple progress bar showing:

1. Business snapshot
2. The offer we are backing
3. Your people
4. Story, voice and proof
5. Lead magnet and content fuel
6. Systems and setup
7. How we work together

### Card 1: "Business snapshot"

**Subtitle:** Where you are right now.

**Microcopy Example:**
> "Business snapshot
> 
> Give us a quick overview of where your business is today. This context helps us build the right funnel."

**Fields:**
- Business name
- Your name
- Your role
- Revenue band (dropdown/select)
- Locations
- Current site (URL)
- Main channels (checkboxes or tags)

**Field Mappings:**
```
business_name: string
contact_name: string
contact_role: string
revenue_band: string (enum: "<$50k", "$50k-$100k", "$100k-$250k", "$250k-$500k", "$500k+")
locations: string[]
current_site_url: string
main_channels: string[] (e.g., "Social Media", "SEO", "Email", "Paid Ads", etc.)
```

---

### Card 2: "The offer we are backing"

**Subtitle:** The main offer this funnel will sell.

**Microcopy Example:**
> "The offer we are backing
> 
> Tell us about the main offer this funnel will promote. What makes it compelling?"

**Fields:**
- Offer name
- Who it is for
- What is included
- How it is delivered
- Timeline
- Pricing
- How to show pricing (display options)

**Field Mappings:**
```
offer_name: string
offer_target_audience: text
offer_includes: text
delivery_method: text
delivery_timeline: string
pricing: string
pricing_display_option: string (enum: "Show prices", "Hide prices", "Show on request")
```

---

### Card 3: "Your people"

**Subtitle:** The clients you actually want more of.

**Microcopy Example:**
> "Your people
> 
> Help us understand your ideal client deeply - their pains, outcomes, objections, and why they choose you."

**Fields:**
- Ideal client description
- Top pains (list)
- Top outcomes (list)
- Objections (list)
- Reasons people choose you (list)
- Competitors (list)

**Field Mappings:**
```
ideal_client_description: text
top_pains: string[]
top_outcomes: string[]
objections: string[]
reasons_to_choose: string[]
competitors: string[]
```

---

### Card 4: "Story, voice and proof"

**Subtitle:** How you sound and how you win trust.

**Microcopy Example:**
> "Story, voice and proof
> 
> Define your voice, share proof, and show what makes you credible in your space."

**Fields:**
- 3 voice words
- Words to avoid
- Testimonials (multiple)
- Case studies (file uploads or links)
- Review links (URLs)
- Logos (file uploads - client/partner logos)
- Awards/features (list or text area)

**Field Mappings:**
```
voice_words: string[] (exactly 3)
words_to_avoid: string[]
testimonials: text[]
case_studies: string[] (file paths or URLs)
review_links: string[]
client_logos: string[] (uploaded file paths)
awards_features: text
```

---

### Card 5: "Lead magnet and content fuel"

**Subtitle:** Questions, mistakes and topics that pull the right people in.

**Microcopy Example:**
> "Lead magnet and content fuel
> 
> Share the questions your ideal clients ask, common mistakes they make, and topics where you want to be known as the expert."

**Fields:**
- Top buyer questions (list)
- Common mistakes (list)
- Topics to be known for (list)
- Existing lead magnet (URL or description)
- Keep or replace (radio/select)
- Preferred format (checkboxes - PDF, Video, Quiz, etc.)

**Field Mappings:**
```
buyer_questions: string[]
common_mistakes: string[]
topics_to_be_known_for: string[]
existing_lead_magnet: text
lead_magnet_action: string (enum: "Keep existing", "Replace with new", "Create new in addition")
preferred_formats: string[] (e.g., "PDF", "Video", "Quiz", "Webinar", "Email Series")
```

---

### Card 6: "Systems and setup"

**Subtitle:** Website, email and tracking so everything talks to each other.

**Microcopy Example:**
> "Systems and setup
> 
> Connect the dots between your website, email platform, booking system, and tracking tools. This ensures everything works together seamlessly."

**Fields:**
- Website platform and access
- Domain provider
- DNS access or tech contact
- Email platform and access
- Booking link
- CRM info (platform and access)
- Tracking/ads used (checkboxes or tags)
- Privacy policy (URL)
- Terms (URL)
- Any disclaimers (text area)

**Field Mappings:**
```
website_platform: string
website_access_details: text (or encrypted)
domain_provider: string
dns_access_or_contact: text
email_platform: string
email_access_details: text (or encrypted)
booking_link: string
crm_platform: string
crm_access_details: text (or encrypted)
tracking_ads_used: string[] (e.g., "Google Analytics", "Facebook Pixel", "LinkedIn Insight", etc.)
privacy_policy_url: string
terms_url: string
disclaimers: text
```

---

### Card 7: "How we work together"

**Subtitle:** Decisions, replies and where you plan to send traffic.

**Microcopy Example:**
> "How we work together
> 
> Set expectations for communication, decision-making, and where you'll be driving traffic to this funnel."

**Fields:**
- Main decision maker (name and email)
- Secondary contact (name and email - optional)
- Communication channel (dropdown - Email, Slack, WhatsApp, etc.)
- Review speed (dropdown - "Same day", "24 hours", "48 hours", "Weekly")
- Blackout dates (date picker or text)
- Traffic focus channels (checkboxes - where they plan to drive traffic)

**Field Mappings:**
```
main_decision_maker_name: string
main_decision_maker_email: string
secondary_contact_name: string (optional)
secondary_contact_email: string (optional)
communication_channel: string (enum: "Email", "Slack", "WhatsApp", "Zoom", "Other")
review_speed: string (enum: "Same day", "24 hours", "48 hours", "Weekly", "As needed")
blackout_dates: string[] (date strings or JSON)
traffic_focus_channels: string[] (e.g., "Social Media", "Email List", "Paid Ads", "SEO", "Podcast", etc.)
```

---

## Branding Elements

### Global Tagline
Display at the top of both Launch Kit and Growth Kit pages:

**"Story led campaigns powered by AI. Your answers feed the system."**

### Hero Text

**Launch Kit:**
> "Launch Kit: Klaro will walk you through these steps so we can build your 3 page site in 14 days."

**Growth Kit:**
> "Growth Kit: Klaro will help you set up the pieces we need to build your funnel and emails in 14 days."

---

## Microcopy Guidelines

### Card Headers
Each card should have:
- Clear, action-oriented title
- Descriptive subtitle
- Brief explanatory microcopy (2-3 sentences max)

### Progress Indicators
- Show current step clearly
- Display completed steps (checkmark or filled)
- Show remaining steps (grayed out or unfilled)
- Include step numbers (e.g., "Step 1 of 6")

### Form Field Labels
- Use clear, conversational language
- Avoid jargon unless necessary
- Include examples or placeholders where helpful
- Show character limits if applicable

### Button Text
- Use action verbs: "Continue", "Save and Continue", "Submit"
- Avoid generic "Next" when context-specific text is clearer
- Use "Complete" or "Finish" for final step

### Error Messages
- Be helpful and specific
- Explain what went wrong
- Provide guidance on how to fix

### Success Messages
- Confirm what was saved
- Show what's next
- Keep it encouraging and clear

---

## Field Validation Rules

### Required Fields
- Business name
- Contact name
- Contact email
- All "voice words" fields (exactly 3)

### Email Validation
- Standard email format validation
- Check for valid domain

### URL Validation
- Validate URL format
- Allow http, https
- Optional: check if URL is reachable

### File Uploads
- Logo: Accept image formats (PNG, JPG, SVG)
- Photos: Accept image formats (PNG, JPG)
- Case studies: Accept PDF, DOC, DOCX
- Max file size: 10MB per file

### Array Fields
- Minimum items where specified (e.g., 3 voice words)
- Allow dynamic adding/removing
- Provide helpful defaults or examples

---

## Database Schema Considerations

### Kit Selection
- Users should be associated with either Launch Kit or Growth Kit
- Store kit type: `kit_type: "launch" | "growth"`

### Progress Tracking
- Track completion status per card
- Store: `card_id`, `completed_at`, `data_submitted`
- Calculate overall progress percentage

### Data Storage
- Store form submissions as JSON or structured data
- Consider versioning for edits
- Timestamp all submissions

### User Association
- Link submissions to user account
- Track submission history
- Allow draft saves

---

## UI/UX Considerations

### Card Design
- Use card-based layout for each step
- Show clear visual hierarchy
- Include back/forward navigation
- Save progress automatically

### Progress Visualization
- Horizontal progress bar at top of page
- Show percentage complete
- Highlight current step
- Visual separation between completed/pending

### Responsive Design
- Mobile-friendly forms
- Touch-friendly input sizes
- Readable on all screen sizes
- Optimize file uploads for mobile

### Accessibility
- Proper form labels
- ARIA attributes where needed
- Keyboard navigation support
- Screen reader friendly

---

## Implementation Notes

### Conditional Rendering
- Only show Launch Kit navigation if user has Launch Kit
- Only show Growth Kit navigation if user has Growth Kit
- Users may have both kits (show both)

### Data Persistence
- Auto-save form data as user types (debounced)
- Allow users to come back and continue
- Show "Last saved" timestamp

### Submission Flow
- Allow partial submissions (draft mode)
- Final submission button on last card
- Confirmation message after submission
- Redirect to home or confirmation page

### Admin View
- Admins should see all submissions
- Filter by kit type
- Filter by completion status
- Export data capability

---

## Next Steps

After reviewing this document:

1. **Database Schema Design** - Create tables/collections based on field mappings
2. **Form Component Development** - Build reusable form components for each card
3. **Progress Tracking** - Implement progress bar and completion logic
4. **File Upload Handling** - Set up file storage and management
5. **Validation Rules** - Implement all validation rules
6. **Admin Dashboard** - Build admin view for managing submissions
7. **Microcopy Refinement** - Finalize all user-facing text
8. **Testing** - Test complete flows for both kits

---

*Document Version: 1.0*  
*Last Updated: [Current Date]*  
*Status: Requirements Specification*

