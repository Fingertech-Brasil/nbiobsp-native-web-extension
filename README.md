# NBioBSP Native Web Extension

A minimal web extension for the Fingkey Hamster biometric device, utilizing the eNBioBSP SDK and integrating it via a native application using the native messaging protocol (Currently Chrome and Windows only).

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
   ```bash
   npm run build:app
   ```
   **Note:** Build and reload the extension after making changes to see them.

3. **Load extension in Chrome:**
   - Open `chrome://extensions/`
   - Enable **Developer mode** (toggle in top right)
   - Click **Load unpacked**
   - Select the generated `/extension/app/dist` folder
   - Copy the **Extension ID** (random letters after `ID:` on the extension page)

4. **Update the Extension ID:**
   - Open `native-app/nativehost-chrome.json`
   - Replace the placeholder in `allowed_origins` with your extension ID:
     ```json
     "allowed_origins": ["chrome-extension://YOUR_EXTENSION_ID_HERE/"]
     ```

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

**For end users:** Run the installer `NBioBSP Extension Setup.exe`

**For development:** Register the native app manifest directly in the registry:

```powershell
REG ADD "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.nbiobsp_native_web_ext" /ve /t REG_SZ /d "C:\path\to\your\project\native-app\build\nativehost-chrome.json" /f
```

**Important:** Replace `C:\path\to\your\project` with your actual absolute path. The `native-app.exe` must be in the same folder as the manifest JSON file.

## Testing

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

**Note:** The extension communicates with the sample page using `postMessage` API. No additional configuration is needed beyond loading the extension in Chrome.

## Channel corruption

If the stdio channels receive unexpected data, such as debugging information from devices, they will corrupt the communication channel with Native Messaging, and the extension will return the error message: `Error when communicating with the native messaging host.`

Run `./native-app/resources/checkStdIO.ps1` to view the data the Native Host attempts to send back to the browser extension. The expected output is `{"data":{"device-count":1},"error":0,"message":"Devices enumerated successfully."}` and nothing else.

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

1. Verify the extension ID in `native-app/nativehost-chrome.json` matches your Chrome extension ID
2. Check that the registry entry is correct:
   ```powershell
   reg query "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.nbiobsp_native_web_ext"
   ```
3. Ensure `native-app.exe` is in the same directory as `nativehost-chrome.json`
4. Check the log file `native_host_log.txt` in the same directory as `native-app.exe` for errors

## Additional Documentation

- Chrome Native Messaging: `https://developer.chrome.com/docs/extensions/develop/concepts/native-messaging`
- eNBioBSP SDK Documentation: Check the SDK installation folder for API documentation

## VS Code Extensions

Recommended VS Code extensions for development:

- **C/C++** (Microsoft) - Code formatting and IntelliSense for C++ files
- **CMake Tools** (Microsoft) - IntelliSense and build integration with CMake

Configuration files are provided in `.vscode/` directory.
