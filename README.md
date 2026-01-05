# HashDoctor 1.13a - AI Medical Portal

HashDoctor is a world-class, comprehensive AI-assisted medical platform designed to provide high-fidelity clinical guidance and international specialist linking. It features role-based dashboards, AI-driven triage, and integrated financial management for global medical access.

## 🚀 Key Features

- **AI Medical Liaison**: A sophisticated AI assistant capable of real-time triage via both voice and text.
- **Offline-Ready Clinical Knowledge**: The AI logic is embedded with extensive protocols for:
    - **First Aid**: Detailed instructions for bleeding, choking (Heimlich), CPR, burns, and sprains (RICE).
    - **Simple Ailments**: Comprehensive home care for common colds, mild fevers, indigestion, minor cuts, and insect bites.
- **Dual-Modality Architecture**: 
    - **Voice (Mic)**: Utilizes the `gemini-2.5-flash-native-audio` API for low-latency, real-time spoken consultations.
    - **Text (Chat)**: Utilizes the `gemini-3-flash` Chat API with `sendMessageStream` for robust, high-performance diagnostic logging.
- **Triage Clarification Protocol**: Advanced logic to identify ambiguous inputs or transcription errors, prompting the user for specific clarifications to ensure patient safety.
- **Specialist Directory & Routing**: Intelligent referral system to human specialists for serious conditions.
- **Financial Governance**: Integrated wallet system with subscription tiers and escrow-backed consultation fees.
- **Global SOS Interface**: Rapid-response emergency signal for life-threatening situations.

## 🛠 Technical Stack

- **Frontend**: React 19 (ESM), Tailwind CSS.
- **AI Engine**: Google Gemini API (@google/genai).
    - **Models**: `gemini-3-flash-preview` (Text/Reasoning), `gemini-2.5-flash-native-audio-preview-09-2025` (Real-time Voice), `gemini-2.5-flash-preview-tts` (Speech Generation).
- **Communication**: Persistent session management for gapless audio and streaming text.

## ⚖️ Clinical Disclaimer

HashDoctor is designed for informational purposes and immediate first-aid guidance. It acts as a triage layer and medical liaison. Users are always advised to consult qualified human specialists for formal diagnoses and ongoing medical care.

---
*HashDoctor - Linking Humanity through Intelligent Healthcare.*