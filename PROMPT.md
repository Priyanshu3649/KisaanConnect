# Prompt for Generating the KisaanConnect Web Application

## 1. Core App Concept

You are an expert AI coding assistant. Your task is to build a complete, production-quality web application called **KisaanConnect**. This application is an AI-powered platform designed to empower Indian farmers by providing them with data-driven insights, community tools, and access to critical information.

## 2. Technology Stack

-   **Framework:** Next.js with the App Router.
-   **Language:** TypeScript.
-   **UI Library:** React with functional components and hooks.
-   **Component Library:** shadcn/ui. You must use pre-built components like `Card`, `Button`, `Dialog`, `Table`, `Select`, etc., wherever appropriate.
-   **Styling:** Tailwind CSS. All styling should be done via utility classes.
-   **AI/Generative Features:** Genkit, using Google AI models (e.g., Gemini 1.5 Flash). All AI logic must be encapsulated in server-side Genkit flows.
-   **Backend & Database:** Firebase (Authentication, Firestore, Storage).
-   **Charts:** Recharts, integrated via shadcn/ui chart components.
-   **Maps:** Leaflet.

## 3. Style and Design Guidelines

-   **Primary Color:** Earthy Green (`#86A36F`, HSL: `93 20% 53%`)
-   **Background Color:** Desaturated Beige (`#F2EAE3`, HSL: `30 42% 92%`)
-   **Accent Color:** Warm Orange (`#D98E42`, HSL: `29 68% 55%`)
-   **Fonts:** 'Inter' for body text, 'Alegreya' for headlines.
-   **Layout:** Clean, structured, and spacious. Use `Card` components extensively to organize information. The app should be fully responsive for both desktop and mobile.
-   **Icons:** Use the `lucide-react` library for all icons.

## 4. Core Features & Implementation Details

### 4.1. Authentication
-   Implement user registration and login pages.
-   Support sign-in with Email/Password, Google, and Phone (OTP).
-   Use Firebase Authentication.
-   Upon registration, create a user document in a `users` collection in Firestore to store profile information (name, email, photoURL, PAN, Aadhaar, etc.).
-   Authenticated users should be directed to `/dashboard`. Non-authenticated users should be redirected to the login page (`/`).

### 4.2. Main App Layout
-   Create a main dashboard layout (`/dashboard/layout.tsx`) that includes:
    -   A persistent sidebar for desktop navigation.
    -   A persistent header with user menu, language switcher, and notifications.
    -   A bottom navigation bar for mobile.
    -   A floating Voice Assistant button.

### 4.3. Farmer Dashboard (`/dashboard`)
-   This is the main landing page after login.
-   Display key metrics in `Card` components: Total Revenue, Crop Varieties, Active Diagnoses, and Agri-Credit Score.
-   Include a chart for Monthly Earnings.
-   Show a table of the 3 most recent Crop Diagnoses.
-   Display a summary of the user's Agri-Credit Score with improvement tips.
-   Show a card with the current weather for the user's location.
-   All data should be fetched from corresponding Genkit flows or Firestore collections.

### 4.4. Crop Diagnosis (`/dashboard/crop-diagnosis`)
-   Allow users to upload an image of a plant or take a photo with their device's camera.
-   Create a Genkit flow (`diagnoseCrop`) that takes the image (as a Base64 data URI) and sends it to a Gemini model.
-   The AI should identify the crop, detect diseases/pests, and provide a confidence score, organic/chemical treatment plans, and prevention tips.
-   The response should be formatted as a single string with markdown for easy display.
-   Save the diagnosis result and the image URL (from Firebase Storage) to a `diagnoses` collection in Firestore.

### 4.5. Digital Twin (`/dashboard/digital-twin`)
-   Display an interactive Leaflet map where a user can select a location.
-   Create a Genkit flow (`getDigitalTwinData`) that takes latitude/longitude as input.
-   The flow should simulate or generate realistic data for:
    -   Soil analysis (health score, moisture, type, N-P-K levels, pH).
    -   AI-powered recommendations for the best crops to sow.
    -   Financial forecasting (costs for conventional vs. organic, expected profit, failure probability).
    -   Live alerts (e.g., water stress, nutrient deficiency).
-   Create another Genkit flow (`getSatelliteImage`) to generate a satellite-style image of the selected coordinates.

### 4.6. Other Key Features (Create a page and a corresponding Genkit flow for each)

-   **Live Mandi Prices (`/dashboard/mandi-prices`):**
    -   UI with dropdowns to select commodity, state, and market.
    -   A flow (`getMandiPrices`) that returns simulated but realistic price data.
    -   Display data in a clean, sortable table.

-   **AI Sales Advisor (`/dashboard/sales-advisor`):**
    -   UI with the same filters as Mandi Prices.
    -   A flow (`getSalesAdvice`) that analyzes price trends (using data from `getMandiPrices`) and provides a "Sell," "Hold," or "Strong Sell" recommendation with a confidence score and a 7-day price forecast chart.

-   **Equipment Rentals (`/dashboard/equipment-rentals`):**
    -   A marketplace UI to view and list equipment for rent.
    -   Store rental listings in a `rentals` collection in Firestore.
    -   Allow users to upload their own equipment with images (use Firebase Storage).
    -   Implement sorting by distance and price.

-   **Government Schemes (`/dashboard/government-schemes`):**
    -   Display a list of major agricultural schemes.
    -   Include a "Check Eligibility" feature that opens a dialog.
    -   A flow (`checkSchemeEligibility`) takes user input (land size, income) and uses an AI model to determine likely eligibility and explain the reasoning.

-   **Inventory Management (`/dashboard/inventory`):**
    -   A simple table-based UI to add, edit, and delete inventory items (seeds, fertilizers, etc.).
    -   Data should be stored in an `inventory` collection in Firestore, scoped to the current user.
    -   Highlight items that are below a user-defined low-stock threshold.

### 4.7. Platform Features

-   **Multilingual Support:**
    -   Use a React Context (`TranslationProvider`) for internationalization.
    -   Provide translation JSON files for at least English (`en`) and Hindi (`hi`). All UI text should use the `t()` function from this context.

-   **Voice Assistant:**
    -   Implement a floating action button for voice commands.
    -   Use the browser's `webkitSpeechRecognition` API.
    -   Create a Genkit flow (`processVoiceCommand`) to interpret navigation commands (e.g., "Go to dashboard," "Show me Mandi prices").
    -   Create a Genkit flow (`aiAssistant`) to handle general queries (e.g., "What is the weather today?"). This flow should use tools to call other flows like `getWeather` and respond with text and synthesized speech.

-   **Genkit Flows (`src/ai/flows/`):**
    -   All flows must be defined with Zod schemas for inputs and outputs.
    -   Use the `'use server';` directive at the top of each flow file.
    -   Include robust `try...catch` blocks to handle potential AI failures and always return a valid, structured response or a clear error message.

## 5. Final Structure

Ensure the final file structure is logical and follows Next.js App Router conventions. Place reusable components in `src/components`, UI components from shadcn in `src/components/ui`, Genkit flows in `src/ai/flows`, and context providers in `src/context`.
