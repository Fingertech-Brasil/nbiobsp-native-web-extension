# NBioBSP Native Web Extension

A cross-browser web extension for the Fingkey Hamster biometric device, utilizing the eNBioBSP SDK and integrating it via a native application using the native messaging protocol. Supports Chrome (Manifest V3) and Firefox/Mozilla-based browsers (Manifest V2) on Windows.

## Development Requirements

### Required Software

1. **eNBioBSP SDK** - Download from `https://suporte.fingertech.com.br/portal-do-desenvolvedor/`
   - Install to default path: `C:/Program Files (x86)/NITGEN/eNBSP SDK Professional/SDK`

2. **Build Tools** (for native app):
   - **MinGW-w64 GCC Compiler** - Install via MSYS2
   - **CMake** - Build system generator
   - **NSIS** - Installer creation tool

3. **Node.js** - For building the browser extension

4. **VS Code** (recommended) - For development with C/C++ and CMake Tools extensions

### Quick Installation (Windows with winget)

If you have `winget` installed, you can install all build tools with:

```powershell
# Install CMake
winget install -e --id Kitware.CMake

# Install NSIS
winget install -e --id NSIS.NSIS

# Install MSYS2 (includes MinGW-w64)
winget install -e --id MSYS2.MSYS2

# After MSYS2 installs, run these commands to install GCC:
C:\msys64\usr\bin\bash.exe -lc "pacman -Syu --noconfirm"
C:\msys64\usr\bin\bash.exe -lc "pacman -S --noconfirm mingw-w64-x86_64-gcc mingw-w64-x86_64-make"

# Add MinGW to PATH (in PowerShell as Administrator):
[Environment]::SetEnvironmentVariable("Path", [Environment]::GetEnvironmentVariable("Path", "User") + ";C:\msys64\mingw64\bin", "User")
```

**Note:** Restart VS Code after installation to ensure PATH changes are loaded.

## Repository Structure

This repository is divided into two main components:

- **`extension`**: A browser extension that renders information on web pages and communicates with the native app to request biometric data.
  - **`app`**: The extension itself
  - **`sample-page`**: A sample index page that demos how the extension would be used by a website
  - **`shared`**: Shared scripts and styles between the app and the sample-page
- **`native-app`**: A system-native application that interfaces directly with the user's machine and the connected biometric device. It is installed and updated by the browser extension.

This project aims to provide a streamlined solution for integrating biometric authentication into web applications.

## Running the project

### Getting started with the extension

1. **Install dependencies:**
   ```bash
   npm i
   ```

2. **Build the extension:**

   **For Chrome/Chromium-based browsers:**
   ```bash
   npm run build:app
   ```
   
   **For Firefox/Mozilla-based browsers:**
   ```bash
   npm run build:firefox
   ```
   
   **Note:** Build and reload the extension after making changes to see them.

3. **Load extension in your browser:**

   #### Chrome/Chromium (Edge, Brave, etc.):
   - Open `chrome://extensions/`
   - Enable **Developer mode** (toggle in top right)
   - Click **Load unpacked**
   - Select the generated `/extension/app/dist` folder
   - Copy the **Extension ID** (random letters after `ID:` on the extension page)
   
   #### Firefox/Mozilla-based (Zen, etc.):
   - Open `about:debugging`
   - Click **This Firefox**
   - Click **Load Temporary Add-on**
   - Navigate to `/extension/app/dist` and select `manifest.json`
   - **Note:** The extension will be removed when Firefox closes. For permanent installation, the extension needs to be signed by Mozilla or use Firefox Developer Edition/Nightly with `xpinstall.signatures.required` set to `false` in `about:config`.

4. **Update the Native Messaging Configuration:**

   **For Chrome:**
   - Open `native-app/nativehost-chrome.json`
   - Replace the placeholder in `allowed_origins` with your extension ID:
     ```json
     "allowed_origins": ["chrome-extension://YOUR_EXTENSION_ID_HERE/"]
     ```
   
   **For Firefox:**
   - The configuration is already set in `native-app/nativehost-firefox.json` with:
     ```json
     "allowed_extensions": ["nbiobsp_native_web_ext@fingertech.com.br"]
     ```
   - This matches the `browser_specific_settings.gecko.id` in the Firefox manifest.

5. **Run the sample webpage:**
   ```bash
   npm run dev
   ```
   The sample page will be available at `http://localhost:5173/` with hot reload enabled.

### Getting started with the native app

**Prerequisites:** Make sure you have installed all Development Requirements listed above.

#### Step 1: Configure CMake Build System

Open VS Code Command Palette (`Ctrl+Shift+P`), run `Tasks: Run Task` and select `cmakeGenerate`. This sets up the MinGW Makefiles generator and creates the build folder (only needed once).

**If you encounter errors:** The tasks.json should use `"MinGW Makefiles"` generator, not `"Unix Makefiles"`. If you see CMake errors, ensure your `.vscode/tasks.json` has:
```json
"args": ["-G", "MinGW Makefiles", "-B", "native-app/build"]
```

**Manual build (alternative):**
```powershell
# Clean and regenerate build files
Remove-Item -Path "native-app\build" -Recurse -Force
cmake -G "MinGW Makefiles" -B native-app/build
```

#### Step 2: Build the Native App

Run `Tasks: Run Task` again and select `buildAndPackage`.

**Manual build (alternative):**
```powershell
# Build the executable
cmake --build native-app/build --config Release --target native-app

# Create the installer
cpack --config native-app/build/CPackConfig.cmake -B native-app/build
```

This will generate:
- `native-app/build/native-app.exe` - The native messaging host
- `native-app/build/NBioBSP Extension Setup.exe` - The installer

#### Step 3: Register the Native App

**For end users:** Run the installer `NBioBSP Extension Setup.exe` - it automatically registers the native messaging host for both Chrome and Firefox.

**For development:** Register the native app manifests directly in the registry:

**Chrome:**
```powershell
REG ADD "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.nbiobsp_native_web_ext" /ve /t REG_SZ /d "C:\path\to\your\project\native-app\build\nativehost-chrome.json" /f
```

**Firefox:**
```powershell
REG ADD "HKCU\Software\Mozilla\NativeMessagingHosts\com.nbiobsp_native_web_ext" /ve /t REG_SZ /d "C:\path\to\your\project\native-app\build\nativehost-firefox.json" /f
```

**Important:** Replace `C:\path\to\your\project` with your actual absolute path. The `native-app.exe` must be in the same folder as the manifest JSON files.

## Testing

**Note:** The testing process is the same for both Chrome and Firefox. Make sure to:
- Use `npm run build:app` and load the extension in Chrome, OR
- Use `npm run build:firefox` and load the extension in Firefox

1. **Start the sample page:**
   ```bash
   npm run dev
   ```

2. **Access the test page:**
   Open `http://localhost:5173/` in Chrome

3. **Test the biometric operations:**
   - **Enumerate Devices** - Detects connected biometric devices
   - **Enroll** - Captures fingerprint for enrollment
   - **Capture** - Captures fingerprint for verification
   - **Verify** - Verifies captured fingerprint against enrolled template

**Note:** The extension communicates with the sample page using `postMessage` API. No additional configuration is needed beyond loading the extension in your browser.

## Browser Compatibility

### Chrome vs Firefox: Technical Differences

This extension uses different build targets to support both Chrome and Firefox due to their different extension APIs and manifest versions:

| Feature | Chrome Build | Firefox Build |
|---------|-------------|---------------|
| **Manifest Version** | V3 (modern) | V2 (required for full compatibility) |
| **Background Script** | Service Worker | Persistent Background Page |
| **Module System** | ES Modules | IIFE (Immediately Invoked Function Expression) |
| **API Namespace** | `chrome.*` with polyfill fallback | `browser.*` (native + polyfill) |
| **Native Messaging Config** | `allowed_origins` (extension ID) | `allowed_extensions` (gecko.id) |

### Build Process

**Chrome (`npm run build:app`):**
- Uses Vite to bundle TypeScript/Preact into ES modules
- Generates `manifest.json` (Manifest V3)
- Scripts load as `type="module"`
- Service worker runs in background

**Firefox (`npm run build:firefox`):**
- Builds with Vite (same as Chrome)
- Converts all ES modules to IIFE format (Firefox MV2 requirement)
- Swaps to `manifest.firefox.json` → `manifest.json` (Manifest V2)
- Injects `webextension-polyfill` for cross-browser compatibility
- Updates popup.html to load scripts in correct order with defer attribute

The conversion process ensures that:
1. The polyfill loads first and exposes `window.browser`
2. All imports are removed and replaced with references to the global `browser` object
3. Module code is wrapped in IIFE to prevent scope pollution
4. The manifest uses MV2 syntax (background.scripts array instead of service_worker)

## Troubleshooting

### CMake Generator Errors

If you see errors like `CMake was unable to find a build program corresponding to "Unix Makefiles"`:

1. Delete the build directory: `Remove-Item -Path "native-app\build" -Recurse -Force`
2. Ensure `.vscode/tasks.json` uses `"MinGW Makefiles"` generator
3. Regenerate: `cmake -G "MinGW Makefiles" -B native-app/build`

### Channel Corruption

If the stdio channels receive unexpected data (such as debugging information from devices), they will corrupt the communication channel with Native Messaging. The extension will return the error message: `Error when communicating with the native messaging host.`

**To diagnose:**
Run the diagnostic script:
```powershell
./native-app/resources/checkStdIO.ps1
```

**Expected output:**
```json
{"data":{"device-count":1},"error":0,"message":"Devices enumerated successfully."}
```

If you see additional output or different data, it indicates channel corruption from the device or SDK.

### Extension Not Communicating with Native App

**Chrome:**
1. Verify the extension ID in `native-app/nativehost-chrome.json` matches your Chrome extension ID
2. Check that the registry entry is correct:
   ```powershell
   reg query "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.nbiobsp_native_web_ext"
   ```
3. Ensure `native-app.exe` is in the same directory as `nativehost-chrome.json`
4. Check the log file `native_host_log.txt` in the same directory as `native-app.exe` for errors

**Firefox:**
1. Verify the gecko ID in `extension/app/dist/manifest.json` matches the ID in `native-app/nativehost-firefox.json` (`nbiobsp_native_web_ext@fingertech.com.br`)
2. Check that the registry entry is correct:
   ```powershell
   reg query "HKCU\Software\Mozilla\NativeMessagingHosts\com.nbiobsp_native_web_ext"
   ```
3. Ensure `native-app.exe` is in the same directory as `nativehost-firefox.json`
4. Open the Browser Console (`Ctrl+Shift+J`) to check for native messaging errors
5. Verify the extension was built with `npm run build:firefox` (not `build:app`)

### Firefox Popup Appears Blank

If the popup shows empty in Firefox:

1. **Check browser console:** Right-click the extension icon → Manage Extension → Click "Inspect" button → Check Console tab for JavaScript errors
2. **Verify correct build:** Make sure you ran `npm run build:firefox` (not `build:app`)
3. **Check script loading:** In the console, you should see the polyfill load first, then utils, then popup
4. **Common error messages:**
   - `"Browser API not available"` → Polyfill didn't load or expose `window.browser`
   - `"N is not defined"` or `"s is not defined"` → ES module conversion failed
   - `SyntaxError` → Scripts not converted to IIFE format

**To verify scripts are correct:**
```powershell
# All scripts should start with "(function()"
Get-Content extension/app/dist/scripts/popup.js -Head 5
Get-Content extension/app/dist/scripts/utils.js -Head 5
Get-Content extension/app/dist/scripts/background.js -Head 5
```

### Firefox Extension Removed After Restart

This is expected behavior for temporary add-ons in Firefox. To keep the extension installed:

- **Option 1:** Load it again from `about:debugging` after each restart
- **Option 2:** Use Firefox Developer Edition or Nightly and disable signature verification:
  1. Go to `about:config`
  2. Set `xpinstall.signatures.required` to `false`
  3. Install the extension from a `.xpi` file
- **Option 3:** Submit the extension to Mozilla Add-ons for signing (for production use)

## Additional Documentation

- **Chrome Extensions:**
  - Native Messaging: `https://developer.chrome.com/docs/extensions/develop/concepts/native-messaging`
  - Manifest V3: `https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3`
- **Firefox Extensions:**
  - Native Messaging: `https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Native_messaging`
  - Browser Extensions API: `https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions`
  - webextension-polyfill: `https://github.com/mozilla/webextension-polyfill`
- **eNBioBSP SDK:** Check the SDK installation folder for API documentation

## VS Code Extensions

Recommended VS Code extensions for development:

- **C/C++** (Microsoft) - Code formatting and IntelliSense for C++ files
- **CMake Tools** (Microsoft) - IntelliSense and build integration with CMake

Configuration files are provided in `.vscode/` directory.
## Project Configuration Files

### Extension Manifests
- **`extension/app/public/manifest.json`** - Chrome Manifest V3 (original)
- **`extension/app/public/manifest.firefox.json`** - Firefox Manifest V2

### Native Messaging Hosts
- **`native-app/nativehost-chrome.json`** - Chrome native messaging configuration
- **`native-app/nativehost-firefox.json`** - Firefox native messaging configuration

### Build Scripts
- **`extension/app/scripts/convert-to-iife.mjs`** - Converts ES modules to IIFE for Firefox
- **`extension/app/scripts/prepare-firefox.mjs`** - Orchestrates Firefox build process

### Key Dependencies
- **`webextension-polyfill`** (v0.12.0) - Cross-browser API compatibility
- **`preact`** - Lightweight React alternative for UI
- **`vite`** (v7.2.7) - Build tool and bundler