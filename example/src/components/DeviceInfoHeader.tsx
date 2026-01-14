import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

interface DeviceInfo {
  platform: string;
  device: string;
  system: string;
}

export const DeviceInfoHeader: React.FC = () => {
  const [time, setTime] = useState(new Date());
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    platform: Platform.OS === 'android' ? 'Android' : 'iOS',
    device: '—',
    system: `${Platform.OS} ${Platform.Version}`,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Get device info
    if (Platform.OS === 'android') {
      setDeviceInfo({
        platform: 'Android',
        device: Platform.constants?.Model || 'Android Device',
        system: `API ${Platform.Version}`,
      });
    } else {
      setDeviceInfo({
        platform: 'iOS',
        device: 'iPhone/iPad',
        system: `iOS ${Platform.Version}`,
      });
    }
  }, []);

  const formatTime = (date: Date): string => {
    const hh = date.getHours().toString().padStart(2, '0');
    const mm = date.getMinutes().toString().padStart(2, '0');
    const ss = date.getSeconds().toString().padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.time}>{formatTime(time)}</Text>
      <Text style={styles.info} numberOfLines={1}>
        {deviceInfo.platform} • {deviceInfo.device} • {deviceInfo.system}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  time: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E',
    fontVariant: ['tabular-nums'],
  },
  info: {
    flex: 1,
    fontSize: 13,
    color: '#607D8B',
    textAlign: 'right',
  },
});
