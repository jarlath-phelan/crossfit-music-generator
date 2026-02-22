# PushPress Platform & API Research

**Date**: 2026-02-22
**Purpose**: Deep-dive into PushPress API capabilities for auto-importing workouts/WODs into Crank (CrossFit Playlist Generator).
**Context**: User's gym uses PushPress (not SugarWOD). Prior research in `2026-02-21-sugarwod-research.md` rated PushPress as "LOW" feasibility with limited information. This document corrects and expands that assessment.

---

## Table of Contents

1. [Platform Overview](#1-platform-overview)
2. [API Availability](#2-api-availability)
3. [Authentication](#3-authentication)
4. [Available Endpoints & SDK Resources](#4-available-endpoints--sdk-resources)
5. [Workout Data Access](#5-workout-data-access)
6. [Webhooks & Events](#6-webhooks--events)
7. [Zapier Integration](#7-zapier-integration)
8. [PushPress Grow Workflows](#8-pushpress-grow-workflows)
9. [Data Export & Import](#9-data-export--import)
10. [Rate Limits, Pricing & Terms](#10-rate-limits-pricing--terms)
11. [Developer Program & Partner Ecosystem](#11-developer-program--partner-ecosystem)
12. [Comparison with SugarWOD](#12-comparison-with-sugarwod)
13. [Implementation Feasibility](#13-implementation-feasibility)
14. [Recommended Integration Strategy](#14-recommended-integration-strategy)
15. [Sources](#15-sources)

---

## 1. Platform Overview

PushPress is an end-to-end gym management platform for boutique gyms, fitness studios, and personal trainers. It consists of several products:

| Product | Purpose |
|---------|---------|
| **Core** | Gym management: billing, CRM, class scheduling, check-ins, leads |
| **Grow** | Marketing CRM (built on HighLevel/GoHighLevel): workflows, automations, lead nurture |
| **Train** | Workout tracking, programming, benchmarks, session plans |
| **Members App** | Member-facing mobile app (iOS/Android) for check-in, WOD viewing, score logging |
| **Staff App** | Staff-facing mobile app for class management and check-ins |
| **Screens** | Digital signage app (Amazon Fire TV) for gym TVs to display WODs and class attendance |

### Pricing

PushPress pricing ranges from $159/month to $559/month depending on the tier, plus add-on fees. The platform targets affiliate gym owners running CrossFit, functional fitness, and similar studios.

### Scale

PushPress is one of the top 3 gym management platforms in the CrossFit ecosystem alongside Wodify and Zen Planner. They serve thousands of gyms worldwide, though exact numbers are not publicly disclosed.

---

## 2. API Availability

### Updated Assessment: YES -- PushPress has a Platform API

Contrary to some third-party review sites (GetApp reported "does not have an API available"), PushPress **does** have an active Platform API. The confusion arises because:

1. The API is relatively new and still maturing (the TypeScript SDK is labeled "early alpha")
2. It is not broadly marketed to gym owners -- it is aimed at integration partners and developers
3. Documentation is hosted on a separate domain, not linked from the main PushPress website

### API Documentation

| Resource | URL |
|----------|-----|
| **API Docs (Scalar)** | https://ppe.apidocumentation.com/ |
| **Dev API Docs** | http://api.pushpressdev.com/platform/docs/ |
| **TypeScript SDK (Official)** | https://github.com/PushPress/pushpress-ts |
| **TypeScript SDK (npm)** | https://www.npmjs.com/package/@pushpress/pushpress |
| **PHP SDK** | https://github.com/PushPress/php-sdk |
| **Speakeasy SDK (older)** | https://github.com/speakeasy-sdks/pushpress-typescript-sdk |

### Base URL

```
https://api.pushpress.com/v3
```

### SDK Status

The official TypeScript SDK (`@pushpress/pushpress`) is at version 1.11.3 (as of December 2025). It is generated using Speakeasy, a code-generation platform for API SDKs, which suggests the underlying API has an OpenAPI specification.

**Critical caveat**: The SDK README states it is "currently in early alpha and is not yet production-ready." Breaking changes may occur.

The SDK is also advertised as an installable **MCP server** (Model Context Protocol), where SDK methods are exposed as tools for AI applications -- a novel and relevant feature for our LLM-based pipeline.

---

## 3. Authentication

### API Key Authentication

```typescript
import { PushPress } from "@pushpress/pushpress";

const pushPress = new PushPress({
  apiKey: "<YOUR_API_KEY>",
  companyId: "<YOUR_COMPANY_ID>",
});
```

- **apiKey**: Required. Set when initializing the SDK client.
- **companyId**: Required. Identifies the gym/company.
- **Bearer Authentication**: Also supported (likely for OAuth flows).

### How to Obtain an API Key

PushPress Grow provides API key generation through the admin dashboard. The help article "How to Obtain Your API Key From Your Grow Account" documents this process. This key is primarily for CRM/Grow integrations but may overlap with the Platform API.

For the Platform API specifically, access may require contacting PushPress directly or being part of their developer/partner program. The API documentation portal does not appear to have a self-service key generation flow like SugarWOD does.

### Key Scope

API keys appear to be scoped per-company (gym), similar to SugarWOD's per-affiliate model. Each gym would need to provide their own API key for Crank to access their data.

---

## 4. Available Endpoints & SDK Resources

Based on the TypeScript SDK documentation and API reference, the following resource categories are available:

### Confirmed Resources

| Resource | Operations | Description |
|----------|-----------|-------------|
| **customers** | `list` | List/paginate gym members |
| **keys** (apiKeys) | `list`, `create` | Manage API keys |
| **checkins** | Event-based | Check-in event data (id, customer, company, timestamp, name, typeId, classId, role) |
| **appointments** | `get` | Retrieve appointment details |
| **webhooks** (manageWebhooks) | `create`, `delete`, `get`, `list`, `update` | Full webhook CRUD |
| **messages.email** | `send` | Send emails |
| **messages.notifications** | `sendPing` | Send push notifications |
| **messages.push** | `send` | Send push messages |
| **apps** | Various | App install management |

### Notable Absences

Based on available documentation, the following resources are **NOT** confirmed in the Platform API:

- **Workouts / WODs** -- No endpoint found for fetching daily workout programming
- **Classes / Schedule** -- No endpoint for class schedules (though the calendar service exists internally)
- **Programs / Tracks** -- No endpoint for programming tracks
- **Movements / Exercises** -- No movement library endpoint
- **Benchmarks** -- No benchmark workout endpoint
- **Scores / Results** -- No workout result logging endpoint

This is the critical finding: **The PushPress Platform API appears to focus on CRM/operational data (customers, check-ins, appointments, messaging) rather than workout/programming data.**

### Pagination

The SDK supports async iteration for paginated responses:

```typescript
for await (const customer of result) {
  // Process each customer
}
```

### Retry Support

Some endpoints support automatic retries with configurable strategy.

---

## 5. Workout Data Access

### Train by PushPress -- The Workout System

PushPress's workout tracking lives in a product called **Train**. Train handles:

- Workout programming (daily WODs, multi-week programs)
- Workout builder (HIIT, Olympic lifting, supersets, custom divisions)
- Score logging and leaderboards
- Benchmark tracking
- Programming partner integration (Mayhem, NCFIT, PRVN, CAP)

### How Workouts Are Programmed

Coaches use the **Train Workout Builder** (web app at train.pushpress.com) to:
1. Create workouts manually or import from CSV
2. Assign programming from partners (Mayhem, NCFIT, PRVN, Park City Fit)
3. Publish workouts to specific dates, programs, and divisions
4. Workouts appear in the Members App and on Screens (gym TV)

### Is Train Data Available via the Platform API?

**Not confirmed.** The Platform API documentation does not list workout/WOD endpoints. Train appears to have its own internal API that powers:
- The Train web app (train.pushpress.com)
- The Members App workout view
- The Screens App workout display

These internal APIs are not documented for third-party developers. The data flows through PushPress's internal systems but is not exposed through the v3 Platform API.

### The Screens App Angle

The PushPress Screens App displays workouts on gym TVs. It pulls workout data from Train and renders it. The app is a Fire TV application, suggesting it calls an internal API to fetch today's WOD. If this internal endpoint were documented or accessible, it would be ideal for our use case -- but it is not publicly available.

---

## 6. Webhooks & Events

### Platform API Webhooks

The Platform API has full webhook management (CRUD operations):

```typescript
// Create a webhook
await pushPress.manageWebhooks.create({
  url: "https://our-api.fly.dev/webhooks/pushpress",
  events: ["checkin.created"],
});

// List webhooks
const webhooks = await pushPress.manageWebhooks.list();
```

### Known Webhook Event Types

| Event | Description | Data Fields |
|-------|-------------|-------------|
| `checkin.created` | Member checks into a class | id, customer, company, timestamp, name, typeId, classId, type, role |
| Appointment events | Appt booked, checked-in, rescheduled, canceled, no-show | Appointment details |

### Relevance to Our Use Case

The `checkin.created` webhook could be useful for a "just checked in" trigger:

```
Member checks into class
  -> Webhook fires to Crank
  -> Crank fetches today's WOD (from another source)
  -> Auto-generates playlist
  -> Sends push notification with playlist link
```

However, the webhook payload does not include workout data -- only check-in metadata. We would still need a separate source for the actual WOD text.

---

## 7. Zapier Integration

PushPress integrates with Zapier for no-code automation.

### Available Zapier Triggers (PushPress -> External)

| Trigger | Description |
|---------|-------------|
| Check-in event | Fires when a member checks into a class or open gym |
| New Client Added | Fires when a new client is created |
| New Reservation Made | Fires when a class reservation is made |
| Membership subscription created | Fires on new subscription |
| Membership subscription activated | Fires on subscription activation |
| Membership subscription canceled | Fires on cancellation |
| Membership subscription paused | Fires on pause |
| Person updated | Fires when a person record is updated |

### Available Zapier Actions (External -> PushPress)

| Action | Description |
|--------|-------------|
| Create Lead or Member | Create a new person in PushPress |
| Create Registration | Create a new registration |

### Workout Data via Zapier

**No workout-specific triggers exist.** There is no "New Workout Published" or "WOD Created" trigger. The triggers are all CRM/membership/check-in focused.

The "Check-in event" trigger is the closest to our use case, but it tells us a member checked in -- not what workout they are doing.

---

## 8. PushPress Grow Workflows

PushPress Grow (the CRM product) has its own workflow automation system with triggers and actions.

### Workflow Triggers

| Trigger | Description |
|---------|-------------|
| Category Completed | A product/plan category is completed |
| Membership New Signup | Customer subscribes to a membership |
| Offer Access Granted | Access to an offer is granted |
| Offer Access Removed | Access to an offer is removed |
| Product Access Granted | Access to a product is granted |
| Product Access Removed | Access to a product is removed |
| Appointment (all states) | Booked, checked-in, rescheduled, canceled, no-show |

### Custom Webhook Action

Grow workflows support a **Custom Webhook Action** (LC Premium feature) that can send HTTP requests to external URLs:
- Configurable HTTP methods (GET, POST, PUT, etc.)
- Custom headers and authorization
- Query parameters
- Custom value mapping

This is the most promising integration path within PushPress Grow: a gym owner could set up a workflow that fires a webhook to Crank whenever a member checks in.

### Limitation

Grow workflows do not have access to Train (workout) data. They operate on CRM data only: contacts, appointments, memberships, products. There is no "workout published" trigger in the Grow workflow system.

---

## 9. Data Export & Import

### CSV Import for Workout Programming

Coaches can upload workouts via CSV files:
- One week at a time into the Train Workout Builder
- Must follow PushPress's required CSV format
- This is a manual process -- no API for programmatic CSV upload

### CSV Import for Workout History

Members can import workout history from:
- SugarWOD (dedicated import path with benchmark linking)
- Wodify (supports Weightlifting, Metcons, Gymnastics files)
- Generic CSV files

Members must log into train.pushpress.com to access import features.

### Data Export

- Members can export their own workout history as CSV
- Exports must be initiated by the member from their individual account
- No bulk export API for gym owners

### RSS / Data Feeds

No RSS feeds or public data feeds for workout programming found.

---

## 10. Rate Limits, Pricing & Terms

### API Rate Limits

No specific rate limit numbers are documented in public materials. The Engineering team has written about rate limiting challenges (they use AWS SQS/Lambda queuing for Grow API throttling), suggesting they are aware of and manage rate limits, but exact numbers for the Platform API are not published.

### API Pricing

The Platform API does not appear to have separate pricing. Access seems to be included for integration partners and developers. However, since the API requires a company ID and API key, the underlying gym must have an active PushPress subscription ($159-559/month).

### Terms of Service

No dedicated API-specific terms of service found (unlike SugarWOD which has explicit developer ToS). The Platform API is likely governed by PushPress's general terms of service.

### Developer Program

PushPress does not appear to have a formal, public developer program with self-service registration, documentation portal, and API key provisioning like SugarWOD does. Instead, their approach is:
1. Built-in integrations (Zapier, Stripe, Mailchimp, etc.)
2. Integration partners (HybridAF, Kisi)
3. Programming partners (Mayhem, NCFIT, PRVN, Park City Fit)
4. The Platform API and SDKs appear to be aimed at selected partners rather than the general developer community

---

## 11. Developer Program & Partner Ecosystem

### Programming Partners

PushPress has deep integrations with workout programming providers:

| Partner | Monthly Cost | Integration |
|---------|-------------|-------------|
| **Mayhem** (Rich Froning) | $129/mo | Auto-uploads affiliate programming weekly |
| **NCFIT** (Jason Khalipa) | $169/mo | Auto-uploads programming and session plans weekly |
| **PRVN Fitness** | Varies | Daily video briefs, session plans, expert programming |
| **Park City Fit** | Varies | Programming partner |
| **CrossFit Affiliate Programming (CAP)** | Via CrossFit | HQ daily programming |

These partners push programming directly into Train via a partner API. This partner API is not documented publicly -- it is a B2B integration.

### Technology Partners

| Partner | Category |
|---------|----------|
| HybridAF | 24/7 gym access control |
| Kisi | Access control |
| Zapier | No-code automation |

### Integrations Hub

As of late 2025, PushPress introduced an "Integrations Hub" in Core for self-serve setup of third-party connections. Currently includes HybridAF, Kisi, and Zapier. This could expand to include more partners over time.

### PushPress GitHub Presence

| Repository | Description |
|------------|-------------|
| `PushPress/pushpress-ts` | TypeScript SDK |
| `PushPress/php-sdk` | PHP SDK |
| `PushPress/fastify-app-template` | App starter template (Fastify + Zod + Kysely + BullMQ) |

The fastify-app-template repository suggests PushPress provides a template for building apps that integrate with their platform, indicating an intent to support third-party development.

### Engineering Blog (Medium)

PushPress Engineering publishes technical blog posts covering API architecture, calendar service optimization, and integration patterns. Key posts include:
- "Optimizing Our Legacy Calendar Service" -- details their class scheduling API architecture
- "Using Serverless Technologies to Enhance our Google Calendar Integration"
- "API Integration Throttling Slowing You Down?" -- AWS SQS/Lambda for Grow API queuing
- "How PushPress Integrates AI into Software Development"

---

## 12. Comparison with SugarWOD

| Capability | SugarWOD | PushPress |
|-----------|----------|-----------|
| **Public API** | Yes (v2, beta, since 2017) | Yes (v3, early alpha) |
| **API Documentation** | Comprehensive, public | Limited, partner-focused |
| **Self-service API keys** | Yes (gym owner generates in settings) | Unclear (may require partnership) |
| **Workout/WOD endpoints** | Yes (`GET /v2/workouts`, `GET /v2/workoutshq`) | **Not available** in Platform API |
| **Movement library API** | Yes (`GET /v2/movements`) | Not available |
| **Benchmark API** | Yes (`GET /v2/benchmarks`) | Not available |
| **Programming tracks API** | Yes (`GET /v2/tracks`) | Not available |
| **Athlete/member API** | Yes (`GET /v2/athletes`) | Yes (`customers.list()`) |
| **Structured data format** | JSON:API specification | JSON (likely OpenAPI-based) |
| **SDKs** | None (community only) | Official TypeScript + PHP |
| **Webhooks** | Preliminary (select partners) | Full CRUD (Platform API) |
| **Zapier workout triggers** | Not available | Not available |
| **Developer ToS** | Yes (explicit) | Not found (general ToS) |
| **Rate limits** | Documented (429 response) | Not documented |
| **MCP server support** | No | Yes (SDK as MCP server) |

### Key Difference

SugarWOD is a **workout-first platform** that added gym ops integrations. PushPress is a **gym management platform** that added workout tracking (Train). This fundamental difference is reflected in their APIs:

- **SugarWOD's API exposes workouts** because workouts are their core product
- **PushPress's API exposes CRM/operational data** because gym management is their core product

Train (the workout product) appears to have its own internal API that is not yet exposed through the public Platform API.

---

## 13. Implementation Feasibility

### Revised Assessment: MEDIUM (upgraded from LOW)

The prior research rated PushPress as LOW feasibility based on "no public API." That was incomplete. PushPress does have a Platform API with SDKs, webhooks, and documentation. However, the critical gap remains: **no public endpoints for workout/WOD data**.

### What We CAN Do Today

1. **Check-in webhooks**: Get notified when a member checks into a class via the `checkin.created` webhook event
2. **Customer data**: List gym members for user identification
3. **Appointment data**: Retrieve appointment details
4. **Custom webhook from Grow workflows**: Receive webhook payloads when CRM events occur

### What We CANNOT Do Today

1. **Fetch today's WOD**: No endpoint exists in the Platform API to retrieve workout programming
2. **List workout history**: No API access to logged scores or past workouts
3. **Browse programming tracks**: No endpoint for program/track metadata
4. **Search movements or benchmarks**: No movement library API

### Possible Future Paths

1. **Platform API expansion**: PushPress is actively developing the API (early alpha). Workout endpoints may be added. The MCP server support and Speakeasy SDK generation suggest they are investing in developer experience.

2. **Train API exposure**: The internal Train API that powers the Members App and Screens App could be documented for third-party use. This is the most likely path to workout data access.

3. **Partnership**: Becoming a PushPress integration partner could grant access to internal APIs or early access to new Platform API endpoints.

4. **Zapier workaround**: While Zapier does not have a workout trigger, it does have a check-in trigger. Combined with another data source for the WOD text (or user manual input), this could work as a trigger mechanism.

---

## 14. Recommended Integration Strategy

### Tier 1: Immediate (No PushPress API needed)

**Manual input with smart defaults for PushPress gym members.**

Since PushPress does not expose workout data via API, the immediate strategy is:

1. User opens Crank
2. User types or photographs today's WOD (displayed on gym's Screens app, whiteboard, or Members App)
3. Our existing `WorkoutParserAgent` processes the text or photo
4. Playlist is generated as normal

This is already what Crank does. No integration needed, but the user experience is manual.

### Tier 2: Short-term (Check-in webhook trigger)

**Use PushPress webhooks as a trigger, not a data source.**

```
Member checks into class at PushPress gym
  -> PushPress fires checkin.created webhook to Crank backend
  -> Crank sends push notification: "Checked in! Snap a photo of the WOD to generate your playlist"
  -> User opens Crank, takes photo, gets playlist
```

Implementation:
- Register a webhook for `checkin.created` events via the Platform API
- Build a simple webhook receiver in the FastAPI backend
- Trigger a push notification (via our own notification system)
- Reduces friction: user gets prompted at the right moment

### Tier 3: Medium-term (Zapier bridge)

**Use Zapier to connect PushPress check-ins to Crank.**

For gyms that want zero-code integration:
1. Gym owner connects PushPress to Zapier
2. "Check-in" trigger -> webhook to Crank's API
3. This avoids the gym needing to manage PushPress API keys directly

### Tier 4: Long-term (Partnership / API evolution)

**Pursue PushPress partnership for workout data access.**

1. Contact PushPress about becoming an integration partner
2. Request access to Train API or early access to workout endpoints
3. If granted, build a `PushPressClient` similar to the proposed `SugarWODClient`:

```python
# apps/api/clients/pushpress_client.py (aspirational)

import httpx

class PushPressClient:
    BASE_URL = "https://api.pushpress.com/v3"

    def __init__(self, api_key: str, company_id: str):
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "X-Company-Id": company_id,
        }

    async def get_todays_workout(self) -> dict:
        """Fetch today's WOD -- requires Train API access."""
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.BASE_URL}/train/workouts/today",
                headers=self.headers,
            )
            resp.raise_for_status()
            return resp.json()
```

This is speculative -- the endpoint does not exist yet.

### Tier 5: Alternative (Hybrid approach)

**Combine PushPress check-in trigger with SugarWOD WOD data.**

Some gyms use both PushPress (for gym management) and SugarWOD (for workout programming). In this case:

```
Member checks in via PushPress
  -> Webhook to Crank
  -> Crank fetches today's WOD from SugarWOD
  -> Auto-generates playlist
  -> Zero manual input needed
```

This is the most powerful near-term integration but requires the gym to use both platforms.

### Architecture Decision

Given the constraints, the recommended architecture for PushPress support is:

```
apps/api/
  clients/
    pushpress_client.py     # Webhook receiver + (future) workout fetcher
  routes/
    webhook_routes.py       # Receive PushPress webhooks
  models/
    schemas.py              # Add PushPressCheckin model
```

The webhook receiver is the only component we can build today with confidence. The workout fetcher should be designed as an interface so we can plug in the real implementation when/if PushPress exposes workout endpoints.

---

## 15. Sources

### PushPress Official

- [PushPress Platform](https://www.pushpress.com/)
- [PushPress Integrations](https://www.pushpress.com/integrations)
- [PushPress Partners List](https://www.pushpress.com/partners/partners-list)
- [Train by PushPress](https://www.pushpress.com/products/train)
- [PushPress Features (Core)](https://www.pushpress.com/products/core)
- [PushPress Screens App](https://updates.pushpress.com/en/new-screens-app)

### API & SDK

- [PushPress API Documentation (Scalar)](https://ppe.apidocumentation.com/)
- [PushPress Dev API Docs](http://api.pushpressdev.com/platform/docs/)
- [PushPress TypeScript SDK (GitHub)](https://github.com/PushPress/pushpress-ts)
- [PushPress TypeScript SDK (npm)](https://www.npmjs.com/package/@pushpress/pushpress)
- [PushPress PHP SDK (GitHub)](https://github.com/PushPress/php-sdk)
- [Speakeasy TypeScript SDK](https://github.com/speakeasy-sdks/pushpress-typescript-sdk)

### Help Center

- [PushPress Help Center](https://help.pushpress.com/en/)
- [Obtain Grow API Key](https://help.pushpress.com/en/articles/5834296-grow-how-to-obtain-your-api-key-from-your-grow-account)
- [Custom Webhook Action (Grow)](https://help.pushpress.com/en/articles/8041666-grow-advanced-features-how-to-use-the-custom-webhook-lc-premium-workflow-action)
- [Grow Workflow Triggers List](https://help.pushpress.com/en/articles/6273531-grow-list-of-workflow-triggers)
- [Zapier Triggers and Actions](https://help.pushpress.com/en/articles/3516983-core-zapier-triggers-we-send-and-receive)
- [Train Workout Builder](https://help.pushpress.com/en/articles/5622292-programming-workouts-using-the-train-workout-builder)
- [Programming & Viewing Workouts](https://help.pushpress.com/en/articles/9867845-programming-viewing-workouts-with-train-members-app)
- [CSV Import for Workout Building](https://help.pushpress.com/en/articles/8587831-train-how-to-import-workouts-from-csv-for-workout-building)
- [Import Workout History](https://help.pushpress.com/en/articles/5714725-how-to-import-workout-history-from-previous-software-into-pushpress-train)
- [Screens App Overview](https://help.pushpress.com/en/articles/9904139-screens-app-screens-2-0-overview)
- [Integrations Hub](https://help.pushpress.com/en/articles/12631598-how-to-use-pushpress-integrations-hub)
- [Affiliate Programming Partners](https://help.pushpress.com/en/articles/9114053-how-to-add-affiliate-programming-partner-in-pushpress)
- [Manage Training Programs](https://help.pushpress.com/en/articles/12803826-how-do-i-manage-training-programs-in-the-pushpress-train-app)

### Programming Partners

- [Mayhem x Train](https://www.pushpress.com/partners/mayhem)
- [NCFIT x Train](https://www.pushpress.com/partners/ncfit)
- [PRVN x Train](https://www.pushpress.com/partners/prvn)

### Engineering Blog

- [Optimizing Our Legacy Calendar Service (Medium)](https://medium.com/@pushpress-engineering/optimizing-our-legacy-calendar-service-e0a59d2f3210)
- [Serverless Google Calendar Integration (Medium)](https://medium.com/@pushpress-engineering/using-serverless-technologies-to-enhance-our-google-calendar-integration-29de2cfd32d)
- [API Integration Throttling (Medium)](https://medium.com/@pushpress-engineering/api-integration-throttling-slowing-you-down-7afb6ab7a73b)
- [PushPress AI in Development (Medium)](https://medium.com/@arjun_shah/how-pushpress-integrates-ai-into-software-development-51ada589c440)

### Third-Party / Zapier

- [PushPress on Zapier](https://zapier.com/apps/pushpress/integrations)
- [PushPress + Workload Webhooks](https://www.workload.co/api/pushpress/integrations/webhook/)
- [PushPress GitHub Organization](https://github.com/pushpress)

### Comparison / Reviews

- [PushPress vs SugarWOD (SourceForge)](https://sourceforge.net/software/compare/PushPress-vs-SugarWOD/)
- [Wodify vs PushPress (GetApp)](https://www.getapp.com/recreation-wellness-software/a/wodify/compare/pushpress/)
- [PushPress Pricing (GetApp)](https://www.getapp.com/recreation-wellness-software/a/pushpress/pricing/)
- [PushPress Reviews (Capterra)](https://www.capterra.com/p/172781/PushPress/)
- [PushPress Pricing (Exercise.com)](https://www.exercise.com/grow/how-much-does-push-press-cost/)
- [Switching SugarWOD to PushPress Train](https://www.alllevel.ca/blog/switching-from-sugarwod-to-push-press-train)
