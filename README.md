# Greensight 🌱

A mobile app designed to simplify and systematize the observation and tracking of microgreen growth for analysis and forecasting.

## Key Features ✨

* **Batch Tracking:** Register new lots of seeds, specifying microgreen type, sowing date, substrate, and estimated harvest time.
* **Phenology Journal:** Log daily/periodic observations including visual changes, photos, sprout height, and notes on care (watering, lighting). Compare progress with "before/after" photos.
* **Analytics:** View growth graphs (manual height entry) and track moisture history (manual recording). Includes a countdown to estimated harvest.
* **Notifications & Tips:** Customizable push notifications for watering/assessment reminders and helpful hints for optimal growth and avoiding common issues like mold.
* **Microgreens Library:** A database of popular varieties with standard recommendations for germination, temperature, lighting, etc.
* **(Experimental) Image Analysis:** Analyze photos for growth stage, health, and potential issues using AI (requires backend setup).
* **(Experimental) Sensor Integration:** Connect with external sensors to track environmental data.

## Tech Stack 🚀

* **Frontend:** React Native (with Expo)
* **Backend & DB:** Supabase
* **Navigation:** React Navigation
* **UI:** React Native Paper, Custom Components
* **Notifications:** Expo Notifications
* **Image Handling:** Expo Image Picker, Supabase Storage
* **Charts:** React Native Chart Kit

## Getting Started 🏁

1.  **Clone the repository (if applicable):**
    ```bash
    git clone <your-repo-url>
    cd greensight-alpha
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```
3.  **Set up Supabase:**
    * Create a Supabase project.
    * Add your Supabase URL and Anon Key (see `app.json` [cite: uploaded:greensight-alpha/app.json] or ideally use environment variables via `eas.json`/`.env`).
    * Run the necessary SQL scripts to create tables (`batches`, `observations`, `knowledge_base_entries`, `profiles`, `user_achievements`, `achievements`, `sensor_readings`) and storage buckets (`batchimages`, `observation_photos`, `kb_images`, `avatars`).
    * Configure Row Level Security (RLS) policies for tables and storage buckets.
4.  **Run the app:**
    ```bash
    npx expo start
    ```
    * Scan the QR code with the Expo Go app on your device or run on simulators/emulators.

---

Happy Growing! 🌱