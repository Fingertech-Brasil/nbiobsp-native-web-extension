# NBioBSP Native Web Extension

A minimal web extension for the Fingkey Hamster biometric device, utilizing the eNBioBSP SDK and integrating it via a native application using the native messaging protocol (Currently Chrome and Windows only).

## Development Requirements

- `gcc compiler like mingw`
- `cmake`
- `nsis`

## Repository Structure

This repository is divided into two main components:

- **`extension`**: A browser extension that renders information on web pages and communicates with the native app to request biometric data.
- **`native-app`**: A system-native application that interfaces directly with the user's machine and the connected biometric device. It is installed and updated by the browser extension.

This project aims to provide a streamlined solution for integrating biometric authentication into web applications.

## Running the project

Run `cmake -G "Unix Makefiles" -B native-app/build` to set generator and create the build folder where the generator output will go (only need to run once)

To compile the cpp native app in vscode, open the Command Palette with `Ctrl+Shift+P` and run `Tasks: Run Build Task`

Use `Tasks: Run Task` and select `package` to build the installer, the exe will be on `native-app/build/NBioBSP Extension.exe`

To get started using the native-app you can just install the app with the created intaller or, for development, directly add your native app manifest to regedit with the following command (replace placeholder path with absolute path to the native app json on your machine, a copy is created on build folder to allow quicker testing):

```bash
REG ADD "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.nbiobsp_native_web_ext" /ve /t REG_SZ /d "C:\path\to\build\nativehost-chrome.json" /f
```

Update chrome extension id on `nativehost-chrome.json` `allowed_origins`, needs to be the same as your extension ID on chrome

**NOTE:** for the extension to communicate with the native app, `native-app.exe` should be on the same folder as the native app manifest json

## More documentation

Documentation on Chrome Native Messaging can be found here `https://developer.chrome.com/docs/extensions/develop/concepts/native-messaging`

## VSCode Extensions used

Microsoft extensions `C/C++` for code formatting and intelliSense (settings are in .vscode) and `CMake Tools` for intelliSense and ease of build with cmake
