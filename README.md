# SFCC Headless Storefront — Salesforce CRM & React E-Commerce

A modern, decoupled **headless e-commerce storefront** built with **React**, **TypeScript** and **Tailwind CSS**, powered directly by **Salesforce** via REST API and SOQL.

🔗 **Live Demo:** https://screenshot-storefront-magic.lovable.app

---

## 🚀 Overview

Product catalog, pricing, inventory and order capture live in **Salesforce**; the customer-facing UI is a fast, type-safe **React** app with server-side rendering.

### Key Features
- **Live Salesforce catalog (`Product2` + `PricebookEntry`)** — active products with standard pricebook prices fetched via SOQL (with pagination). Only products that have an image are shown.
- **Product Listing Page** — live name/SKU search, category checkboxes with counts, size pills, min/max price, in-stock toggle, sorting, all synced two-way with URL search params.
- **Product Detail Page** — size selection parsed from `Sizes__c`, real-time stock from `Stock__c`.
- **Slide-out cart** — quantities capped by stock, promo code `SFCC20` (20% off), `localStorage` persistence.
- **Checkout (`/checkout`)** — validated form, order summary, server-side re-pricing against live Salesforce data, submission as a Web Lead (`POST /sobjects/Lead`), confirmation screen with order number.

---

## 🛠️ Tech Stack

- **Framework:** TanStack Start (React 19, SSR, server functions), Vite 7
- **Routing & data:** TanStack Router (typed URL search params), TanStack Query
- **UI:** Tailwind CSS v4, shadcn/ui, Lucide icons
- **Validation:** Zod
- **CRM:** Salesforce REST API, SOQL (`Product2`, `PricebookEntry`, `Lead`)
- **Tests:** Vitest (cart logic, promo, stock limits, checkout validation, routing)

---

## 🗄️ Salesforce Data Model

Custom fields on the standard `Product2` object:
- `Category_c__c` *(Picklist)* — `Footwear`, `Apparel`, `Accessories`
- `Image_URL__c` *(URL)* — product image
- `Sizes__c` *(Text)* — comma-separated sizes (e.g. `40, 41, 42` or `S, M, L`)
- `Stock__c` *(Number)* — available inventory

---

## 💻 Local Setup

```bash
git clone <this-repository-url>
cd <repository-name>
npm install
npm run dev
npm test
```

Server-side Salesforce access requires the `LOVABLE_API_KEY` and `SALESFORCE_API_KEY` environment variables.

---

## 📫 Author

- **Bogodar Shmyglyk** — Salesforce & React Developer
- **GitHub:** [@bogodars](https://github.com/bogodars)

Built with [Lovable](https://lovable.dev/projects/945a1bed-fcd9-4a22-a527-7f9079dd897d) — changes sync two-way with this repository.
