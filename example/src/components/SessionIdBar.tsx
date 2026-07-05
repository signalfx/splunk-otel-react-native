import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { SplunkRum } from '@splunk/otel-react-native';

/**
 * Always-visible bar that exposes the current session ID for easy copying.
 *
 * Release builds make it impractical to read the session ID from logs, so this
 * renders the full ID in a read-only, auto-selecting field: tapping it selects
 * the entire ID and surfaces the native "Copy" action, avoiding any re-typing
 * into the O11y platform. Intentionally dependency-free (no native clipboard
 * module required).
 */
export const SessionIdBar: React.FC = () => {
  const [sessionId, setSessionId] = useState<string>('');
  const inputRef = useRef<TextInput>(null);

  const refresh = useCallback(async () => {
    try {
      const session = await SplunkRum.instance.session.state();
      setSessionId(session.id ?? '');
    } catch {
      setSessionId('');
    }
  }, []);

  useEffect(() => {
    // Small delay to allow the SDK to finish installing on first render.
    const timeout = setTimeout(refresh, 500);
    return () => clearTimeout(timeout);
  }, [refresh]);

  const selectAll = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>Session ID</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={refresh}
          accessibilityLabel="Refresh session ID"
        >
          <Text style={styles.refreshText}>↻</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity activeOpacity={0.7} onPress={selectAll}>
        <TextInput
          ref={inputRef}
          style={styles.idField}
          value={sessionId || '—'}
          editable
          showSoftInputOnFocus={false}
          caretHidden
          selectTextOnFocus
          contextMenuHidden={false}
          multiline={false}
          numberOfLines={1}
          // Controlled value keeps the field read-only (edits are ignored).
          onChangeText={() => {}}
          accessibilityLabel="Current session ID"
        />
      </TouchableOpacity>
      <Text style={styles.hint}>Tap the ID to select it, then Copy</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#16213E',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2D2D44',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 10,
    color: '#8888AA',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  refreshButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2D2D44',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  idField: {
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#0F0F23',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2D2D44',
    color: '#4CC2FF',
    fontSize: 13,
    fontFamily: 'Courier',
  },
  hint: {
    fontSize: 10,
    color: '#6C6C8A',
    marginTop: 4,
  },
});
