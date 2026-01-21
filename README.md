# FormulaSnap

**FormulaSnap** is a cross-platform desktop application designed to capture screen regions and instantly recognize mathematical formulas into LaTeX code.

## 🚀 Features

- **Screen Capture:** Select any region on any monitor to capture.
- **Formula Recognition:** Automatically converts captured images to LaTeX.
- **Multi-Monitor Support:** Seamlessly works across multiple displays.
- **System Tray:** Quick access via system tray icon.
- **Custom UI:** Modern, user-friendly interface with VuiHoc branding.

## 🛠️ Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd FormulaSnap
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

## 💻 Development

Run the application in development mode with hot-reload:

```bash
npm run electron:dev
```

## 📦 Build

Create a production-ready application installer/executable:

```bash
npm run electron:build
```

The output files (DMG, Zip, etc.) will be generated in the `release` directory.

## 📂 Project Structure

- `src/`: React renderer process code (UI).
- `electron/`: Electron main process code.
- `dist/`: Built renderer assets.
- `dist-electron/`: Built main process assets.
- `release/`: Packaged application artifacts.
