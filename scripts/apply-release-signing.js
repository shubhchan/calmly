const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const appGradlePath = path.join(rootDir, 'android', 'app', 'build.gradle');
const destKeystorePath = path.join(rootDir, 'android', 'app', 'release.keystore');
const sourceKeystorePath = path.join(rootDir, 'calmly-release.keystore');

// 1. Ensure release.keystore is present in android/app/
if (process.env.ANDROID_KEYSTORE_BASE64) {
  console.log('Using keystore from ANDROID_KEYSTORE_BASE64 environment variable...');
  fs.writeFileSync(destKeystorePath, Buffer.from(process.env.ANDROID_KEYSTORE_BASE64, 'base64'));
} else if (fs.existsSync(sourceKeystorePath)) {
  console.log('Copying calmly-release.keystore to android/app/release.keystore...');
  fs.copyFileSync(sourceKeystorePath, destKeystorePath);
} else {
  console.warn('Warning: No release keystore found!');
}

const storePass = process.env.ANDROID_KEYSTORE_PASSWORD || 'calmlyappkey';
const keyAlias = process.env.ANDROID_KEY_ALIAS || 'calmly';
const keyPass = process.env.ANDROID_KEY_PASSWORD || 'calmlyappkey';

// 2. Patch android/app/build.gradle
if (fs.existsSync(appGradlePath)) {
  let content = fs.readFileSync(appGradlePath, 'utf8');

  if (!content.includes('signingConfigs.release') || content.includes('signingConfig signingConfigs.debug\n            def enableShrinkResources')) {
    // If release signing isn't configured yet
    if (!content.includes('release {\n            storeFile file(\'release.keystore\')')) {
      content = content.replace(
        'signingConfigs {',
        `signingConfigs {\n        release {\n            storeFile file('release.keystore')\n            storePassword '${storePass}'\n            keyAlias '${keyAlias}'\n            keyPassword '${keyPass}'\n        }`
      );
    }
    content = content.replace(
      /release\s*\{\s*(\/\/[^\n]*\n|\s*)*signingConfig\s+signingConfigs\.debug/,
      `release {\n            signingConfig signingConfigs.release`
    );
    fs.writeFileSync(appGradlePath, content, 'utf8');
    console.log('Successfully patched android/app/build.gradle with release signing config.');
  } else {
    console.log('android/app/build.gradle already configured with release signing config.');
  }
}

