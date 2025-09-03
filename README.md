# NBioBSP Native Web Extension

A minimal browser extension for the Fingkey Hamster biometric device, utilizing the eNBioBSP SDK and integrating it via a native application using the native messaging protocol (Currently Chrome and Windows only).

## Repository Structure

This repository is divided into two main components:

- **`extension`**: A browser extension that renders information on web pages and communicates with the native app to request biometric data.
- **`native-app`**: A system-native application that interfaces directly with the user's machine and the connected biometric device. It is installed and updated by the browser extension.

This project aims to provide a streamlined solution for integrating biometric authentication into web applications.

## Running the project

To compile the cpp native app in vscode open the Command Palette with `Ctrl+Shift+P` and run `Tasks: Run Build Task` (requires a gcc compiler like mingw installed)

For development, the native app needs to be added to regedit with the following command (replace placeholder path with absolute path to native app json on your machine):

```bash
REG ADD "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.nbiobsp_native_web_ext" /ve /t REG_SZ /d "C:\path\to\nmh-manifest.json" /f
```

Update chrome extension id on `nativehost-chrome.json` `allowed_origins`

## More documentation

Documentation on Chrome Native Messaging can be found here `https://developer.chrome.com/docs/extensions/develop/concepts/native-messaging`

## VSCode Extension used

Microsoft extension C/C++ for code formatting and intelliSense (settings are in .vscode)
