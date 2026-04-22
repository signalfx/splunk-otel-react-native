import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import {
  getReactNativeVersion,
  getSdkVersion,
} from '@splunk/otel-react-native';

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

  const sdkVersion = useMemo(() => getSdkVersion(), []);
  const rnVersion = useMemo(() => getReactNativeVersion(), []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
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
      <View style={styles.rightColumn}>
        <Text style={styles.info} numberOfLines={1}>
          {deviceInfo.platform} • {deviceInfo.device} • {deviceInfo.system}
        </Text>
        <Text style={styles.versionInfo} numberOfLines={1}>
          SDK {sdkVersion} • RN {rnVersion}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
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
  rightColumn: {
    flex: 1,
    alignItems: 'flex-end',
  },
  info: {
    fontSize: 13,
    color: '#607D8B',
    textAlign: 'right',
  },
  versionInfo: {
    fontSize: 11,
    color: '#90A4AE',
    textAlign: 'right',
    marginTop: 2,
  },
});
