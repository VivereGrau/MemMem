# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## 📦 การสร้างไฟล์ติดตั้งแอปพลิเคชันด้วยตัวเอง (Local Build บน Windows)

ใช้เมื่อต้องการสร้างไฟล์ `.apk` ไปติดตั้งบนมือถือโดยตรง และต้องการเลี่ยงขีดจำกัดการใช้งานโควตา EAS Build คลาวด์

### 🛠 สิ่งที่ต้องมีในเครื่องก่อนบิลด์
1. **Java JDK 17** (Temurin 17) ติดตั้งและเพิ่มลงใน `JAVA_HOME`
2. **Android SDK** (API Level 34 & 35) และ **Android SDK Command-line Tools (latest)** ติดตั้งผ่าน Android Studio
3. **Environment Variables**:
   - เพิ่ม `ANDROID_HOME` ชี้ไปยังโฟลเดอร์ SDK (เช่น `C:\Users\<ชื่อผู้ใช้>\AppData\Local\Android\Sdk`)
   - เพิ่ม `%ANDROID_HOME%\platform-tools`, `%ANDROID_HOME%\emulator`, และ `%ANDROID_HOME%\cmdline-tools\latest\bin` เข้าไปในระบบ `Path`

### 🚀 ขั้นตอนการบิลด์แอปพลิเคชัน (.apk)
1. เปิด Command Prompt หรือ PowerShell แล้วเข้าสู่โฟลเดอร์ `android` ในโปรเจกต์:
   * **กรณีใช้ Command Prompt (CMD)**:
     ```cmd
     cd /d d:\personal\MemMem\android
     ```
   * **กรณีใช้ PowerShell**:
     ```powershell
     cd d:\personal\MemMem\android
     ```
2. สั่งรันคำสั่งบิลด์โหมด Release:
   * **กรณีใช้ Command Prompt (CMD)**:
     ```cmd
     gradlew assembleRelease
     ```
   * **กรณีใช้ PowerShell**:
     ```powershell
     .\gradlew assembleRelease
     ```
3. เมื่อบิลด์เสร็จสิ้น ไฟล์แอปติดตั้ง `.apk` จะถูกสร้างขึ้นที่ตำแหน่ง (โดยอิงตามรูปแบบ `MemMem-release-<เวอร์ชันแอป>.apk` เช่น `MemMem-release-1.0.0.apk` หรือ `MemMem-release-0.1.2.apk`):
   ```text
   android/app/build/outputs/apk/release/MemMem-release-*.apk
   ```
4. สามารถพิมพ์คำสั่งนี้เพื่อเปิดโฟลเดอร์ผลลัพธ์ใน Windows Explorer ทันที:
   ```cmd
   explorer android\app\build\outputs\apk\release
   ```

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
