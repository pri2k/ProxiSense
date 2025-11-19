# **ProxiSense — BLE-Based Contextual Notification System**

A lightweight system that uses **BLE beacons** and **GPS geofencing** to deliver **real-time, personalized notifications** to users inside indoor environments such as malls.

---

## ⭐ **Features**

* Detects user proximity using BLE region monitoring
* Sends contextual notifications (in-app / push / SMS)
* Displays personalized content cards
* User opt-in / opt-out and preference control
* Basic analytics logging for interactions

---

## 🚀 **Run Locally**

**Prerequisite:** Node.js

1. Install dependencies

   ```bash
   npm install
   ```

2. Add your Gemini API key in `.env.local`

   ```
   GEMINI_API_KEY=your_api_key_here
   ```

3. Start the app

   ```bash
   npm run dev
   ```

---

## 🛠 **Tech Stack**

* Next.js / React
* Tailwind CSS
* Gemini API
* BLE scanning (mobile layer)

---

## 📌 **Future Enhancements**

* Multi-floor beacon mapping
* Admin dashboard
* Advanced personalization rules
