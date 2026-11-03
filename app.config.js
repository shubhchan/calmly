const { expo } = require('./app.json');
module.exports = () => {
  const scheme = process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME;
  // Only enable native sign-in after real OAuth configuration is provided.
  const plugins = [...(expo.plugins || [])];
  if (scheme) plugins.push(['@react-native-google-signin/google-signin', { iosUrlScheme: scheme }]);
  return { ...expo, plugins };
};
