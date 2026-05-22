# Payment Collection Client (EMI Calculator App)

This is the front-end client application for the **Payment Collection & EMI Management System**. It is built using **Expo (React Native & React Native Web)**, designed to adapt its user interface dynamically for web browsers, tablets, and native mobile screens.

---

## 🚀 Key Features

* **Multi-Portal View**: Uses a clean, interactive top navigation bar to toggle between the **Customer Portal** and **Admin Dashboard**.
* **Search & Lookup**: Instant customer search using the borrower's account number.
* **Smart Payments**: Validates EMI payments against outstanding balances, automatically updating values and log history.
* **Interactive Modals**: Detailed profiles and complete payment histories expand inside scroll-managed overlays.
* **Hermes Compatibility**: Fully optimized for Android's Hermes engine using custom-built cross-platform date and currency formatters.
* **Cleartext Traffic Support**: Configured to safely communicate with HTTP backend endpoints directly from native builds.

---

## 📂 Project Structure

* **`App.tsx`**: Main entry point handling navigation, screen layout, state management, and visual headers.
* **`src/config.ts`**: Configures the REST API target. Automatically reads `EXPO_PUBLIC_API_URL` or defaults to the production EC2 URL (`http://44.213.113.209`).
* **`src/screens/CustomerPortal.tsx`**: Customer interface containing the loan details card, payments form, live transaction receipt pop-up, and payment logs.
* **`src/screens/AdminDashboard.tsx`**: Administrative control center listing active borrowers, showing portfolio-wide aggregated metrics, and managing the drill-down user inspect modal.

---

## ⚙️ Environment Configuration

By default, the client is pre-configured to communicate with the live production API at `http://44.213.113.209`.

To target a different server (such as a local database on your machine), create a `.env` file in the root of this folder:
```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```
*Note: Expo automatically loads environment variables starting with `EXPO_PUBLIC_` at start/build time.*

---

## 🛠️ Commands & Running Guide

### 1. Install Dependencies
Restore package requirements using the legacy peer flags to ensure clean React 19 package installations:
```bash
npm install --legacy-peer-deps
```

### 2. Launch Client Web App
To run and test the frontend client in your desktop web browser:
```bash
npm run web
```
This launches a local Metro server serving the web build, typically opening at `http://localhost:8081`.

### 3. Run on Mobile (Expo Go)
For live on-device testing and debugging:
1. Start the Expo server:
   ```bash
   npm start
   ```
2. Scan the generated QR code:
   * **Android**: Open the **Expo Go** app and use the scan tool.
   * **iOS**: Scan the QR code using the default Camera app to open in Expo Go.

### 4. Build Standalone Android APK (EAS Build)
The application includes configuration via `app.json` and `eas.json` to compile into an Android `.apk` file for testing:
1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```
2. Log into your Expo profile:
   ```bash
   eas login
   ```
3. Run the preview Android build:
   ```bash
   eas build -p android --profile preview
   ```
4. Scan the completed build's QR code on your Android device to download and run the APK.

---

## 🎨 Design and UI Customizations
* **Icons**: Powered by `lucide-react-native` for modern, responsive vector art.
* **Aesthetics**: Follows a cohesive color scheme of dark slates, emerald highlights, and crisp typography tailored for high-contrast viewing on both phone displays and monitors.
* **Responsiveness**: Utilizes flex layouts and dynamic percentage heights based on the viewport (`Dimensions.get('window').height`) to prevent content compression on native screens.
