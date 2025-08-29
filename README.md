# Simple Biometric Extension

A simple extension for the Fingkey Hamster biometric device, utilizing the eNBioBSP SDK for seamless integration (Currently Chrome and Windows only).

## Repository Structure

This repository is divided into two main components:

- **`extension`**: A browser extension that renders information on web pages and communicates with the native app to request biometric data.
- **`native-app`**: A system-native application that interfaces directly with the user's machine and the connected biometric device. It is installed and updated by the browser extension.

This project aims to provide a streamlined solution for integrating biometric authentication into web applications.

## Running the project

Use the command `g++ native-app/app.cpp -o native-app/native-app.exe` to compile the native app into a `.exe` (requires a gcc compiler like mingw installed)

For development, the native app needs to be added to regedit with this command (replace placeholder path with absolute path to native app json on your machine):

`REG ADD "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.enbiobsp.simple_biometric_native" /ve /t REG_SZ /d "C:\path\to\nmh-manifest.json" /f`

Documentation on Chrome Native Messaging can be found here `https://developer.chrome.com/docs/extensions/develop/concepts/native-messaging`
