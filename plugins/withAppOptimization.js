const { withGradleProperties, withAppBuildGradle, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const PROGUARD_RULES = `
# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# WatermelonDB
-keep class com.nozbe.watermelondb.** { *; }

# MMKV
-keep class com.tencent.mmkv.** { *; }

# react-native-worklets
-keep class com.swmansion.worklets.** { *; }

# Expo Font & Audio
-keep class expo.modules.font.** { *; }
-keep class expo.modules.audio.** { *; }
`;

const UNUSED_FONTS = [
  'AntDesign.ttf',
  'Entypo.ttf',
  'EvilIcons.ttf',
  'Feather.ttf',
  'FontAwesome.ttf',
  'FontAwesome5_Brands.ttf',
  'FontAwesome5_Regular.ttf',
  'FontAwesome5_Solid.ttf',
  'FontAwesome6_Brands.ttf',
  'FontAwesome6_Regular.ttf',
  'FontAwesome6_Solid.ttf',
  'Fontisto.ttf',
  'Foundation.ttf',
  'MaterialIcons.ttf',
  'Octicons.ttf',
  'SimpleLineIcons.ttf',
  'Zocial.ttf',
];

function withOptimizationGradleProperties(config) {
  return withGradleProperties(config, (modConfig) => {
    const props = [
      { key: 'android.enableMinifyInReleaseBuilds', value: 'true' },
      { key: 'android.enableShrinkResourcesInReleaseBuilds', value: 'true' },
      { key: 'reactNativeArchitectures', value: 'arm64-v8a' },
    ];

    for (const { key, value } of props) {
      const existing = modConfig.modResults.find((item) => item.type === 'property' && item.key === key);
      if (existing) {
        existing.value = value;
      } else {
        modConfig.modResults.push({ type: 'property', key, value });
      }
    }

    return modConfig;
  });
}

function withOptimizationProguard(config) {
  return withDangerousMod(config, [
    'android',
    async (modConfig) => {
      const proguardPath = path.join(modConfig.modRequest.platformProjectRoot, 'app', 'proguard-rules.pro');
      if (fs.existsSync(proguardPath)) {
        let content = fs.readFileSync(proguardPath, 'utf8');
        if (!content.includes('com.nozbe.watermelondb')) {
          content += '\n' + PROGUARD_RULES;
          fs.writeFileSync(proguardPath, content, 'utf8');
        }
      }
      return modConfig;
    },
  ]);
}

function withOptimizationAppBuildGradle(config) {
  return withAppBuildGradle(config, (modConfig) => {
    let contents = modConfig.modResults.contents;

    // Add font ignore patterns to ignoreAssetsPattern if not already present
    const fontPattern = ':' + UNUSED_FONTS.join(':');
    if (contents.includes("ignoreAssetsPattern '") && !contents.includes('AntDesign.ttf')) {
      contents = contents.replace(
        /ignoreAssetsPattern\s+'([^']+)'/,
        `ignoreAssetsPattern '$1${fontPattern}'`
      );
      modConfig.modResults.contents = contents;
    }

    return modConfig;
  });
}

module.exports = function withAppOptimization(config) {
  config = withOptimizationGradleProperties(config);
  config = withOptimizationProguard(config);
  config = withOptimizationAppBuildGradle(config);
  return config;
};
