# NBioBSP Native Web Extension

A minimal web extension for the Fingkey Hamster biometric device, utilizing the eNBioBSP SDK and integrating it via a native application using the native messaging protocol (Currently Chrome and Windows only).

## Development Requirements

- `eNBioBSP SDK` you can get the latest version from `https://suporte.fingertech.com.br/portal-do-desenvolvedor/`
- `gcc` compiler like `mingw` and `cmake` (build native app)
- `nsis` (installer)
- `nodejs` (for extension)
- `vscode` (not really required but recommended for development)

## Repository Structure

This repository is divided into two main components:

- **`extension`**: A browser extension that renders information on web pages and communicates with the native app to request biometric data.
- **`native-app`**: A system-native application that interfaces directly with the user's machine and the connected biometric device. It is installed and updated by the browser extension.

This project aims to provide a streamlined solution for integrating biometric authentication into web applications.

## Running the project

### Getting started with the extension

- Install dependencies with `npm --prefix extension i`
- Build with `npm --prefix extension run build`
- On Chrome go to `chrome://extensions/` > activate Developer mode > click `Load unpacked` > select the generated `/extension/dist` folder
- The extension will show on the extension list and will have a `ID:` followed by the extension ID comprised of random letters, copy the random letters and update the field `allowed_origins` on `native-app/nativehost-chrome.json` replacing the placeholder random string

### Getting started with the native app

Before anything, open the Command Palette with `Ctrl+Shift+P`, run `Tasks: Run Task` and select option `cmakeGenerate` to set generator and create the build folder where the generator output will go (only need to run once)

To compile the cpp native app and create the installer in vscode, run `Tasks: Run Task` again and select option `buildAndPackage` the installer exe will be on `native-app/build/NBioBSP Extension.exe`

To get started using the native-app you can just install the app with the generated installer or, for development, directly add your native app manifest to regedit with the following command (replace placeholder path with absolute path to the native app json on your machine, you should point it to the copy created on the build folder):

```bash
REG ADD "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.nbiobsp_native_web_ext" /ve /t REG_SZ /d "C:\path\to\build\nativehost-chrome.json" /f
```

**NOTE:** for the extension to communicate with the native app, `native-app.exe` should be where the manifest `path` is pointing to, in this case on the same folder as the manifest json

## Testing

Running `npm run dev` and accessing `http://localhost:5173/` will render the index page with samples of how a website will communicate with the extension

## More documentation

Documentation on Chrome Native Messaging can be found here `https://developer.chrome.com/docs/extensions/develop/concepts/native-messaging`

## VSCode Extensions used

Microsoft extensions `C/C++` for code formatting and intelliSense (settings are in .vscode) and `CMake Tools` for intelliSense and ease of build with cmake
