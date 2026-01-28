import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SplunkRum } from '@splunk/otel-react-native';

interface StatusBarProps {
  onRefresh?: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({ onRefresh }) => {
  const [sessionId, setSessionId] = useState<string>('—');
  const [status, setStatus] = useState<string>('pending...');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const state = await SplunkRum.instance.getState();
      const session = await SplunkRum.instance.session.state();

      setSessionId(session.id?.substring(0, 12) + '...' || '—');
      setStatus(
        state.status.type === 'Running'
          ? '✓ Running'
          : `✗ ${state.status.type} (${state.status.type === 'NotRunning' ? state.status.reason : ''})`
      );
    } catch (e: any) {
      setStatus(`Error: ${e?.message ?? String(e)}`);
    } finally {
      setIsRefreshing(false);
    }
    onRefresh?.();
  }, [onRefresh]);

  useEffect(() => {
    // Initial fetch after a short delay to allow SDK to initialize
    const timeout = setTimeout(refresh, 500);
    return () => clearTimeout(timeout);
  }, [refresh]);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.statusItem}>
          <Text style={styles.label}>Session</Text>
          <Text style={styles.value} numberOfLines={1}>
            {sessionId}
          </Text>
        </View>
        <View style={styles.statusItem}>
          <Text style={styles.label}>Status</Text>
          <Text
            style={[
              styles.value,
              status.startsWith('✓') ? styles.success : styles.error,
            ]}
          >
            {status}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.refreshButton, isRefreshing && styles.refreshing]}
          onPress={refresh}
          disabled={isRefreshing}
        >
          <Text style={styles.refreshText}>↻</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1A1A2E',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2D2D44',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusItem: {
    flex: 1,
    marginRight: 12,
  },
  label: {
    fontSize: 10,
    color: '#8888AA',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '500',
    marginTop: 2,
  },
  success: {
    color: '#4CAF50',
  },
  error: {
    color: '#FF5252',
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2D2D44',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshing: {
    opacity: 0.5,
  },
  refreshText: {
    fontSize: 20,
    color: '#FFFFFF',
  },
});
