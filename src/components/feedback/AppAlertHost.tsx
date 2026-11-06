import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { View } from 'react-native';
import {
  dismissAlert,
  getActiveAlert,
  pressAlertButton,
  subscribeToAlerts,
  type AlertRequest,
} from '../../services/appAlert';
import { useAppTheme } from '../../theme/ThemeContext';
import { radius, sizes, spacing } from '../../theme/tokens';
import { AppIcon } from '../AppIcon';
import { AppText } from '../ui/AppText';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { TextInput } from '../ui/TextInput';

/**
 * Renders queued `Alert.alert(...)` requests with the design-system modal,
 * matching the ConfirmDialog layout: tinted icon plate, title, message and
 * cancel/confirm actions.
 */
export function AppAlertHost() {
  const { colors } = useAppTheme();
  const request = useSyncExternalStore(subscribeToAlerts, getActiveAlert, getActiveAlert);
  const [shown, setShown] = useState<AlertRequest | null>(null);
  const [input, setInput] = useState('');

  useEffect(() => {
    if (!request) return;
    setShown(request);
    setInput(request.prompt?.defaultValue ?? '');
  }, [request]);

  const data = request ?? shown;
  if (!data) return null;

  const buttons = data.buttons.length ? data.buttons : [{ text: 'OK' }];
  const destructive = buttons.some((button) => button.style === 'destructive');
  const stacked = buttons.length > 2;
  const plateSize = sizes.touchTarget + spacing[3];
  const visible = Boolean(request);

  return (
    <Modal
      visible={visible}
      onClose={() => {
        if (data.cancelable) dismissAlert();
      }}
      onClosed={() => {
        if (!getActiveAlert()) setShown(null);
      }}
      position="center"
      showCloseButton={false}
      dismissOnBackdropPress={data.cancelable}
      scrollable
    >
      <View style={{ alignItems: 'center', paddingTop: spacing[3] }}>
        <View
          style={{
            width: plateSize,
            height: plateSize,
            borderRadius: radius.full,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: destructive ? colors.status.error.subtle : colors.primary.subtle,
            marginBottom: spacing[4],
          }}
        >
          <AppIcon
            name={destructive ? 'i-alert-circle' : 'i-information-circle'}
            size={28}
            color={destructive ? colors.status.error.default : colors.primary.default}
            animated={false}
          />
        </View>
        <AppText variant="h3" center>
          {data.title}
        </AppText>
        {data.message ? (
          <AppText variant="body" tone="secondary" center style={{ marginTop: spacing[2] }}>
            {data.message}
          </AppText>
        ) : null}
        {data.prompt ? (
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Type here"
            secureTextEntry={data.prompt.secureTextEntry}
            accessibilityLabel={data.title}
            containerStyle={{ alignSelf: 'stretch', marginTop: spacing[4] }}
          />
        ) : null}
      </View>
      <View
        style={{
          flexDirection: stacked ? 'column' : 'row',
          gap: spacing[3],
          marginTop: spacing[5],
        }}
      >
        {buttons.map((button, index) => (
          <View key={`${button.text ?? 'button'}-${index}`} style={{ flex: 1 }}>
            <Button
              title={button.text ?? 'OK'}
              variant={
                button.style === 'destructive'
                  ? 'destructive'
                  : button.style === 'cancel'
                    ? 'secondary'
                    : 'primary'
              }
              onPress={() => pressAlertButton(index, data.prompt ? input : undefined)}
              fullWidth
            />
          </View>
        ))}
      </View>
    </Modal>
  );
}
