import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { MobilePlatform, platformLabels, type TestAction } from '../types';

interface TestActionCardProps {
  action: TestAction;
  lastPressed?: Date | null;
}

const formatTime = (date: Date): string => {
  const hh = date.getHours().toString().padStart(2, '0');
  const mm = date.getMinutes().toString().padStart(2, '0');
  const ss = date.getSeconds().toString().padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
};

export const TestActionCard: React.FC<TestActionCardProps> = ({
  action,
  lastPressed,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [pressed, setPressed] = useState<Date | null>(lastPressed ?? null);
  const [error, setError] = useState<string | null>(null);

  const isAndroidOnly =
    action.platforms.size === 1 && action.platforms.has(MobilePlatform.Android);
  const isIosOnly =
    action.platforms.size === 1 && action.platforms.has(MobilePlatform.iOS);
  const isBoth = action.platforms.size === 2;

  const isCurrentPlatformSupported =
    (Platform.OS === 'android' &&
      action.platforms.has(MobilePlatform.Android)) ||
    (Platform.OS === 'ios' && action.platforms.has(MobilePlatform.iOS));

  const handlePress = async () => {
    if (isLoading || !isCurrentPlatformSupported) return;

    setIsLoading(true);
    setError(null);
    setPressed(new Date());

    try {
      await action.onTap();
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setIsLoading(false);
    }
  };

  const buttonColor = (() => {
    if (!isCurrentPlatformSupported) return '#9E9E9E';
    if (isBoth) return '#7C4DFF';
    if (isAndroidOnly) return '#4CAF50';
    if (isIosOnly) return '#607D8B';
    return '#7C4DFF';
  })();

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{action.title}</Text>
        <View style={styles.badges}>
          {action.platforms.has(MobilePlatform.Android) && (
            <View style={[styles.badge, styles.androidBadge]}>
              <Text style={styles.badgeIcon}>🤖</Text>
              <Text style={styles.badgeText}>Android</Text>
            </View>
          )}
          {action.platforms.has(MobilePlatform.iOS) && (
            <View style={[styles.badge, styles.iosBadge]}>
              <Text style={styles.badgeIcon}>🍎</Text>
              <Text style={styles.badgeText}>iOS</Text>
            </View>
          )}
        </View>
      </View>

      <Text style={styles.subtitle}>
        Runs on: {platformLabels(action.platforms)}
      </Text>

      <View style={styles.footer}>
        <View style={styles.descriptionContainer}>
          <Text style={styles.description} numberOfLines={2}>
            {action.description}
          </Text>
          {error && <Text style={styles.error}>{error}</Text>}
        </View>

        <Text style={styles.lastPressed}>
          Last: {pressed ? formatTime(pressed) : '—'}
        </Text>

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: buttonColor },
            !isCurrentPlatformSupported && styles.buttonDisabled,
          ]}
          onPress={handlePress}
          disabled={isLoading || !isCurrentPlatformSupported}
          activeOpacity={0.7}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>
              {isCurrentPlatformSupported ? 'Test' : 'N/A'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E',
    flex: 1,
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 3,
  },
  androidBadge: {
    backgroundColor: '#E8F5E9',
  },
  iosBadge: {
    backgroundColor: '#ECEFF1',
  },
  badgeIcon: {
    fontSize: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#37474F',
  },
  subtitle: {
    fontSize: 12,
    color: '#78909C',
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  descriptionContainer: {
    flex: 1,
  },
  description: {
    fontSize: 14,
    color: '#455A64',
  },
  error: {
    fontSize: 11,
    color: '#E53935',
    marginTop: 2,
  },
  lastPressed: {
    fontSize: 12,
    color: '#90A4AE',
    marginHorizontal: 8,
    fontVariant: ['tabular-nums'],
  },
  button: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
