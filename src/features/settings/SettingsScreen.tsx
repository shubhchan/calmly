import React from 'react';
import { View, Text, ScrollView, Pressable, Switch, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Card, CardContent, PrimaryButton, StatPill } from '../../components';
import { AccentColor } from '../../types/navigation';

const accentOptions: { value: AccentColor; label: string; emoji: string }[] = [
  { value: 'sage', label: 'Sage', emoji: '🌿' },
  { value: 'lavender', label: 'Lavender', emoji: '💜' },
  { value: 'sky', label: 'Sky', emoji: '☁️' },
  { value: 'peach', label: 'Peach', emoji: '🍑' },
  { value: 'rose', label: 'Rose', emoji: '🌹' },
  { value: 'ocean', label: 'Ocean', emoji: '🌊' },
];

const themeOptions: { value: 'light' | 'dark' | 'system'; label: string; emoji: string }[] = [
  { value: 'light', label: 'Light', emoji: '☀️' },
  { value: 'dark', label: 'Dark', emoji: '🌙' },
  { value: 'system', label: 'System', emoji: '📱' },
];

export function SettingsScreen() {
  const { theme, accent, resolvedTheme, setTheme, setAccent, toggleTheme } = useTheme();

  return (
    <ScrollView
      className="flex-1 bg-[var(--color-bg-primary)]"
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 100 }}
    >
      <View className="mb-8">
        <Text className="text-display-sm font-bold" style={{ color: '#1E232E' }}>
          Settings
        </Text>
        <Text className="text-body-lg mt-1" style={{ color: '#34415A' }}>
          Customize your experience
        </Text>
      </View>

      <Card variant="elevated" className="mb-6">
        <CardContent>
          <Text className="text-headline-md font-semibold mb-4" style={{ color: '#1E232E' }}>
            Appearance
          </Text>

          <View className="space-y-4">
            <View>
              <Text className="text-body-md font-medium mb-3" style={{ color: '#1E232E' }}>
                Theme
              </Text>
              <View className="flex-row gap-3">
                {themeOptions.map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={() => setTheme(option.value)}
                    className={`flex-1 flex items-center justify-center py-3 px-4 rounded-xl border-2 transition-all ${
                      theme === option.value
                        ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-bg)]'
                        : 'border-[var(--color-border-light)]'
                    }`}
                  >
                    <Text style={{ fontSize: 24 }}>{option.emoji}</Text>
                    <Text className={`text-label-md font-semibold mt-1 ${theme === option.value ? '' : ''}`} style={{ color: theme === option.value ? '#5A955A' : '#1E232E' }}>
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View>
              <Text className="text-body-md font-medium mb-3" style={{ color: '#1E232E' }}>
                Accent Color
              </Text>
              <View className="flex-row flex-wrap gap-3">
                {accentOptions.map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={() => setAccent(option.value)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all ${
                      accent === option.value
                        ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-bg)]'
                        : 'border-[var(--color-border-light)]'
                    }`}
                  >
                    <Text style={{ fontSize: 20 }}>{option.emoji}</Text>
                    <Text className={`text-label-md font-semibold ${accent === option.value ? '' : ''}`} style={{ color: accent === option.value ? '#5A955A' : '#1E232E' }}>
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        </CardContent>
      </Card>

      <Card variant="elevated" className="mb-6">
        <CardContent>
          <Text className="text-headline-md font-semibold mb-4" style={{ color: '#1E232E' }}>
            Privacy & Security
          </Text>

          <View className="space-y-4">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-body-md font-medium" style={{ color: '#1E232E' }}>
                  App Lock
                </Text>
                <Text className="text-body-sm" style={{ color: '#425474' }}>
                  Require PIN or biometric to open
                </Text>
              </View>
              <Switch
                value={false}
                onValueChange={() => {}}
                trackColor={{ false: '#E4DEBC', true: '#5A955A' }}
                thumbColor="white"
              />
            </View>

            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-body-md font-medium" style={{ color: '#1E232E' }}>
                  Hide in App Switcher
                </Text>
                <Text className="text-body-sm" style={{ color: '#425474' }}>
                  Blur content when switching apps
                </Text>
              </View>
              <Switch
                value={false}
                onValueChange={() => {}}
                trackColor={{ false: '#E4DEBC', true: '#5A955A' }}
                thumbColor="white"
              />
            </View>

            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-body-md font-medium" style={{ color: '#1E232E' }}>
                  Auto-lock Timer
                </Text>
                <Text className="text-body-sm" style={{ color: '#425474' }}>
                  Lock after 1 minute of inactivity
                </Text>
              </View>
              <Text className="text-label-md" style={{ color: '#5A955A' }}>
                1 min →
              </Text>
            </View>
          </View>
        </CardContent>
      </Card>

      <Card variant="elevated" className="mb-6">
        <CardContent>
          <Text className="text-headline-md font-semibold mb-4" style={{ color: '#1E232E' }}>
            Notifications
          </Text>

          <View className="space-y-4">
            {[
              { title: 'Morning Check-in', time: '8:00 AM', enabled: true },
              { title: 'Journal Reminder', time: '7:00 PM', enabled: true },
              { title: 'Habit Reminders', time: 'Custom', enabled: false },
              { title: 'Evening Reflection', time: '9:00 PM', enabled: true },
              { title: 'Weekly Reflection', time: 'Sunday 10:00 AM', enabled: false },
            ].map((item, i) => (
              <View key={i} className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-body-md font-medium" style={{ color: '#1E232E' }}>
                    {item.title}
                  </Text>
                  <Text className="text-body-sm" style={{ color: '#425474' }}>
                    {item.time}
                  </Text>
                </View>
                <Switch
                  value={item.enabled}
                  onValueChange={() => {}}
                  trackColor={{ false: '#E4DEBC', true: '#5A955A' }}
                  thumbColor="white"
                />
              </View>
            ))}
          </View>
        </CardContent>
      </Card>

      <Card variant="elevated" className="mb-6">
        <CardContent>
          <Text className="text-headline-md font-semibold mb-4" style={{ color: '#1E232E' }}>
            Data Management
          </Text>

          <View className="space-y-3">
            <PrimaryButton
              title="Export Data (JSON)"
              variant="outline"
              size="md"
              onPress={() => {}}
              className="w-full"
              fullWidth
              leftIcon={<Text style={{ fontSize: 18 }}>📤</Text>}
            />
            <PrimaryButton
              title="Export Journal (PDF)"
              variant="outline"
              size="md"
              onPress={() => {}}
              className="w-full"
              fullWidth
              leftIcon={<Text style={{ fontSize: 18 }}>📄</Text>}
            />
            <PrimaryButton
              title="Import Data"
              variant="outline"
              size="md"
              onPress={() => {}}
              className="w-full"
              fullWidth
              leftIcon={<Text style={{ fontSize: 18 }}>📥</Text>}
            />
            <PrimaryButton
              title="Delete All Data"
              variant="outline"
              size="md"
              onPress={() => {}}
              className="w-full"
              fullWidth
              leftIcon={<Text style={{ fontSize: 18 }}>🗑️</Text>}
              textStyle={{ color: '#EB697F' }}
            />
          </View>
        </CardContent>
      </Card>

      <Card variant="elevated" className="mb-6">
        <CardContent>
          <Text className="text-headline-md font-semibold mb-4" style={{ color: '#1E232E' }}>
            Accessibility
          </Text>

          <View className="space-y-4">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-body-md font-medium" style={{ color: '#1E232E' }}>
                  Reduce Animations
                </Text>
                <Text className="text-body-sm" style={{ color: '#425474' }}>
                  Minimize motion effects
                </Text>
              </View>
              <Switch
                value={false}
                onValueChange={() => {}}
                trackColor={{ false: '#E4DEBC', true: '#5A955A' }}
                thumbColor="white"
              />
            </View>

            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-body-md font-medium" style={{ color: '#1E232E' }}>
                  Haptic Feedback
                </Text>
                <Text className="text-body-sm" style={{ color: '#425474' }}>
                  Vibration on interactions
                </Text>
              </View>
              <Switch
                value={true}
                onValueChange={() => {}}
                trackColor={{ false: '#E4DEBC', true: '#5A955A' }}
                thumbColor="white"
              />
            </View>

            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-body-md font-medium" style={{ color: '#1E232E' }}>
                  High Contrast
                </Text>
                <Text className="text-body-sm" style={{ color: '#425474' }}>
                  Increase color contrast
                </Text>
              </View>
              <Switch
                value={false}
                onValueChange={() => {}}
                trackColor={{ false: '#E4DEBC', true: '#5A955A' }}
                thumbColor="white"
              />
            </View>
          </View>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Text className="text-headline-md font-semibold mb-4 text-center" style={{ color: '#1E232E' }}>
            About
          </Text>
          <View className="space-y-2 text-center">
            <Text className="text-body-md" style={{ color: '#34415A' }}>
              Calmly v1.0.0
            </Text>
            <Text className="text-body-sm" style={{ color: '#425474' }}>
              A private, offline-first journaling app
            </Text>
            <Pressable
              onPress={() => {}}
              className="mt-4"
            >
              <Text className="text-label-md" style={{ color: '#5A955A' }}>
                Privacy Policy & Terms
              </Text>
            </Pressable>
          </View>
        </CardContent>
      </Card>
    </ScrollView>
  );
}