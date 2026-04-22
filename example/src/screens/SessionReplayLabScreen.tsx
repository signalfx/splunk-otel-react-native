import React, { useCallback, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  SplunkSessionReplay,
  MaskType,
  type SessionReplayState,
  type RecordingMask,
} from '@splunk/otel-session-replay-react-native';

const COLORS = {
  bg: '#0F0F23',
  card: '#1A1A2E',
  border: '#2D2D44',
  accent: '#6C63FF',
  danger: '#FF5252',
  success: '#4CAF50',
  muted: '#8888AA',
  text: '#FFFFFF',
  sensitive: '#FF6B6B',
  input: '#252540',
};

export const SessionReplayLabScreen: React.FC = () => {
  const [state, setState] = useState<SessionReplayState | null>(null);
  const [mask, setMask] = useState<RecordingMask | null>(null);

  const refreshState = useCallback(async () => {
    const s = await SplunkSessionReplay.instance.getState();
    setState(s);
    const m = await SplunkSessionReplay.instance.getRecordingMask();
    setMask(m);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <StatusCard state={state} mask={mask} onRefresh={refreshState} />
        <RecordingControls onChanged={refreshState} />
        <SensitiveContentSection />
        <MaskingControls onChanged={refreshState} />
      </ScrollView>
    </SafeAreaView>
  );
};

const StatusCard: React.FC<{
  state: SessionReplayState | null;
  mask: RecordingMask | null;
  onRefresh: () => void;
}> = ({ state, mask, onRefresh }) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <Text style={styles.cardTitle}>Session Replay State</Text>
      <TouchableOpacity style={styles.smallButton} onPress={onRefresh}>
        <Text style={styles.smallButtonText}>Refresh</Text>
      </TouchableOpacity>
    </View>
    {state ? (
      <View style={styles.stateGrid}>
        <StateRow label="Status" value={state.status} />
        <StateRow
          label="Recording"
          value={state.isRecording ? 'Yes' : 'No'}
          color={state.isRecording ? COLORS.success : COLORS.danger}
        />
        <StateRow label="Sampling Rate" value={String(state.samplingRate)} />
        <StateRow
          label="Mask Elements"
          value={mask ? String(mask.elements.length) : 'none'}
        />
      </View>
    ) : (
      <Text style={styles.placeholder}>Tap Refresh to load state</Text>
    )}
  </View>
);

const StateRow: React.FC<{
  label: string;
  value: string;
  color?: string;
}> = ({ label, value, color }) => (
  <View style={styles.stateRow}>
    <Text style={styles.stateLabel}>{label}</Text>
    <Text style={[styles.stateValue, color ? { color } : undefined]}>
      {value}
    </Text>
  </View>
);

const RecordingControls: React.FC<{ onChanged: () => void }> = ({
  onChanged,
}) => (
  <View style={styles.card}>
    <Text style={styles.cardTitle}>Recording Controls</Text>
    <View style={styles.buttonRow}>
      <TouchableOpacity
        style={[styles.button, styles.successButton]}
        onPress={async () => {
          await SplunkSessionReplay.instance.start();
          onChanged();
        }}
      >
        <Text style={styles.buttonText}>Start</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, styles.dangerButton]}
        onPress={async () => {
          await SplunkSessionReplay.instance.stop();
          onChanged();
        }}
      >
        <Text style={styles.buttonText}>Stop</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const SensitiveContentSection: React.FC = () => {
  const [password, setPassword] = useState('');
  const [creditCard, setCreditCard] = useState('');
  const [ssn, setSsn] = useState('');
  const [notes, setNotes] = useState('');

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Sensitive Content Area</Text>
      <Text style={styles.cardSubtitle}>
        This section contains sensitive UI elements. Verify these are properly
        masked/redacted in the session replay recording.
      </Text>

      <View style={styles.sensitiveGroup}>
        <Text style={styles.sensitiveLabel}>Password</Text>
        <TextInput
          style={styles.sensitiveInput}
          secureTextEntry
          placeholder="Enter password..."
          placeholderTextColor={COLORS.muted}
          value={password}
          onChangeText={setPassword}
        />
      </View>

      <View style={styles.sensitiveGroup}>
        <Text style={styles.sensitiveLabel}>Credit Card Number</Text>
        <TextInput
          style={styles.sensitiveInput}
          placeholder="4242 4242 4242 4242"
          placeholderTextColor={COLORS.muted}
          keyboardType="number-pad"
          value={creditCard}
          onChangeText={setCreditCard}
        />
      </View>

      <View style={styles.sensitiveGroup}>
        <Text style={styles.sensitiveLabel}>SSN / National ID</Text>
        <TextInput
          style={styles.sensitiveInput}
          placeholder="123-45-6789"
          placeholderTextColor={COLORS.muted}
          keyboardType="number-pad"
          value={ssn}
          onChangeText={setSsn}
        />
      </View>

      <View style={styles.sensitiveGroup}>
        <Text style={styles.sensitiveLabel}>
          Private Notes (multi-line text)
        </Text>
        <TextInput
          style={[styles.sensitiveInput, styles.multilineInput]}
          placeholder="Type private notes here..."
          placeholderTextColor={COLORS.muted}
          multiline
          numberOfLines={3}
          value={notes}
          onChangeText={setNotes}
        />
      </View>

      <View style={styles.sensitiveGroup}>
        <Text style={styles.sensitiveLabel}>Displayed PII</Text>
        <View style={styles.piiCard}>
          <Text style={styles.piiText}>John Doe</Text>
          <Text style={styles.piiText}>john.doe@example.com</Text>
          <Text style={styles.piiText}>+1 (555) 123-4567</Text>
          <Text style={styles.piiText}>123 Main Street, Springfield</Text>
        </View>
      </View>

      <View style={styles.sensitiveGroup}>
        <Text style={styles.sensitiveLabel}>
          Balance / Financial (leak test)
        </Text>
        <View style={styles.balanceRow}>
          <Text style={styles.balanceLabel}>Checking</Text>
          <Text style={styles.balanceValue}>$12,345.67</Text>
        </View>
        <View style={styles.balanceRow}>
          <Text style={styles.balanceLabel}>Savings</Text>
          <Text style={styles.balanceValue}>$98,765.43</Text>
        </View>
      </View>
    </View>
  );
};

const MaskingControls: React.FC<{ onChanged: () => void }> = ({
  onChanged,
}) => {
  const maskSensitiveArea = useCallback(async () => {
    await SplunkSessionReplay.instance.setRecordingMask({
      elements: [
        {
          rect: { x: 0, y: 0, width: 9999, height: 9999 },
          type: MaskType.COVERING,
        },
      ],
    });
    onChanged();
    Alert.alert('Mask', 'Full-screen covering mask applied');
  }, [onChanged]);

  const maskWithHole = useCallback(async () => {
    await SplunkSessionReplay.instance.setRecordingMask({
      elements: [
        {
          rect: { x: 0, y: 0, width: 9999, height: 9999 },
          type: MaskType.COVERING,
        },
        {
          rect: { x: 0, y: 0, width: 9999, height: 120 },
          type: MaskType.ERASING,
        },
      ],
    });
    onChanged();
    Alert.alert('Mask', 'Full cover with top-area erasing hole');
  }, [onChanged]);

  const maskPiiOnly = useCallback(async () => {
    await SplunkSessionReplay.instance.setRecordingMask({
      elements: [
        {
          rect: { x: 16, y: 600, width: 380, height: 200 },
          type: MaskType.COVERING,
        },
      ],
    });
    onChanged();
    Alert.alert('Mask', 'PII area covered (approximate coords)');
  }, [onChanged]);

  const clearMask = useCallback(async () => {
    await SplunkSessionReplay.instance.setRecordingMask(null);
    onChanged();
    Alert.alert('Mask', 'Mask cleared - all content visible in replay');
  }, [onChanged]);

  const showMaskState = useCallback(async () => {
    const m = await SplunkSessionReplay.instance.getRecordingMask();
    if (!m) {
      Alert.alert('Current Mask', 'No mask active - everything is visible');
      return;
    }
    const desc = m.elements
      .map(
        (e, i) =>
          `[${i}] ${e.type}: (${e.rect.x},${e.rect.y}) ${e.rect.width}x${e.rect.height}`
      )
      .join('\n');
    Alert.alert('Current Mask', desc);
  }, []);

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Masking Controls</Text>
      <Text style={styles.cardSubtitle}>
        Test different masking strategies and verify sensitive content is hidden
        in the replay.
      </Text>

      <ActionButton
        title="Full-Screen Cover"
        subtitle="Mask everything - nothing should be visible in replay"
        onPress={maskSensitiveArea}
      />
      <ActionButton
        title="Cover + Erasing Hole (Top)"
        subtitle="Cover all, then erase top area - only header visible in replay"
        onPress={maskWithHole}
      />
      <ActionButton
        title="Cover PII Section Only"
        subtitle="Mask only the PII card area using approximate coordinates"
        onPress={maskPiiOnly}
      />
      <ActionButton
        title="Clear Mask (Leak Test)"
        subtitle="Remove all masks - verify everything becomes visible in replay"
        color={COLORS.danger}
        onPress={clearMask}
      />
      <ActionButton
        title="Inspect Current Mask"
        subtitle="Display active mask elements and their coordinates"
        onPress={showMaskState}
      />
    </View>
  );
};

const ActionButton: React.FC<{
  title: string;
  subtitle: string;
  color?: string;
  onPress: () => void;
}> = ({ title, subtitle, color, onPress }) => (
  <TouchableOpacity
    style={[styles.actionButton, color ? { borderLeftColor: color } : null]}
    onPress={onPress}
  >
    <Text style={styles.actionTitle}>{title}</Text>
    <Text style={styles.actionSubtitle}>{subtitle}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 12, paddingBottom: 40 },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: COLORS.muted,
    marginBottom: 12,
  },
  placeholder: { fontSize: 13, color: COLORS.muted, fontStyle: 'italic' },
  stateGrid: { gap: 6 },
  stateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  stateLabel: { fontSize: 13, color: COLORS.muted },
  stateValue: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  buttonRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  successButton: { backgroundColor: COLORS.success },
  dangerButton: { backgroundColor: COLORS.danger },
  buttonText: { color: COLORS.text, fontWeight: '600', fontSize: 14 },
  smallButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  smallButtonText: { color: COLORS.text, fontSize: 12, fontWeight: '600' },
  sensitiveGroup: { marginBottom: 14 },
  sensitiveLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.sensitive,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sensitiveInput: {
    backgroundColor: COLORS.input,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  multilineInput: { minHeight: 70, textAlignVertical: 'top' },
  piiCard: {
    backgroundColor: COLORS.input,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.sensitive,
    borderStyle: 'dashed',
  },
  piiText: { fontSize: 14, color: COLORS.text, marginBottom: 4 },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.input,
    borderRadius: 8,
    padding: 12,
    marginBottom: 4,
  },
  balanceLabel: { fontSize: 14, color: COLORS.muted },
  balanceValue: { fontSize: 14, fontWeight: '700', color: COLORS.success },
  actionButton: {
    backgroundColor: COLORS.input,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent,
  },
  actionTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  actionSubtitle: { fontSize: 11, color: COLORS.muted, marginTop: 2 },
});
