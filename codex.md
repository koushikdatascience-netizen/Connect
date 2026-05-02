# 🧠 SnapKey Frontend Rules (Codex Instructions)

You are working on a production Next.js (App Router) SaaS CRM.

## ⚠️ CRITICAL RULES (DO NOT BREAK)

1. NEVER change the global layout structure:

   * Sidebar (left, fixed, black)
   * Topbar (top, fixed)
   * Content area (dynamic)

2. DO NOT introduce new design systems.

   * Use existing Tailwind setup
   * Use existing classes like:

     * card
     * primary-button
     * field-input

3. GOLD is ONLY an accent color.

   * Do NOT use gold backgrounds everywhere
   * Do NOT use gradients in main UI
   * Use gold only for:

     * buttons
     * active states
     * highlights

4. Background MUST stay:

   * #f8fafc (main)
   * white cards

5. Sidebar MUST stay:

   * black background
   * white text
   * gold highlight for active item

---

## 🧱 PROJECT STRUCTURE (STRICT)

Use this structure:

/components/layout/Sidebar.tsx
/components/layout/Topbar.tsx
/app/(dashboard)/layout.tsx

All pages MUST be inside:
/app/(dashboard)/

---

## 🎯 CURRENT TASK

We are building a **Compose Post Page**

Requirements:

* 3 column layout:

  1. Left: Accounts selection
  2. Center: Post editor
  3. Right: Platform settings

* Must look like modern SaaS (clean, minimal)

* Must NOT look like landing page UI

---

## 🧩 UI RULES

* Use:

  * rounded-xl
  * shadow-sm
  * border-gray-200

* Avoid:

  * heavy shadows
  * gold backgrounds
  * gradients

---

## ⚡ BEHAVIOR RULES

* Platform tabs must switch settings dynamically
* Media upload must support preview
* Inputs must be consistent with field-input class

---

## ❌ DO NOT

* Do not rewrite existing working components
* Do not change sidebar styling
* Do not introduce new CSS frameworks
* Do not break responsiveness

---

## ✅ OUTPUT EXPECTATION

* Clean, production-ready React (Next.js)
* No inline styles unless necessary
* Reusable components
* Proper file structure
