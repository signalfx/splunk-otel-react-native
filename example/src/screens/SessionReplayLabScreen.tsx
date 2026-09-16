import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  findNodeHandle,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type HostInstance,
} from 'react-native';
import {
  MaskType,
  NativeViewClass,
  RenderingMode,
  SensitiveView,
  Sensitivity,
  SplunkSessionReplay,
  type MaskRect,
  type RecordingMask,
  type SessionReplayState,
} from '@splunk/otel-session-replay-react-native';

const COLORS = {
  bg: '#0F0F23',
  card: '#1A1A2E',
  border: '#2D2D44',
  accent: '#6C63FF',
  danger: '#FF5252',
  success: '#4CAF50',
  warn: '#FFB300',
  muted: '#8888AA',
  text: '#FFFFFF',
  sensitive: '#FF6B6B',
  input: '#252540',
};

/**
 * Session Replay privacy showcase.
 *
 * The screen is arranged as a walkthrough of what the native session replay
 * SDKs mask on their own, where those defaults stop, and what this SDK adds on
 * top. Every block is labelled with the behaviour to expect, so a recording of
 * this screen can be checked against the replay side by side.
 */
export const SessionReplayLabScreen: React.FC = () => {
  const [state, setState] = useState<SessionReplayState | null>(null);
  const [mask, setMask] = useState<RecordingMask | null>(null);

  const refresh = useCallback(async () => {
    setState(await SplunkSessionReplay.instance.getState());
    setMask(await SplunkSessionReplay.instance.getRecordingMask());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <StatusCard state={state} mask={mask} onRefresh={refresh} />
        <DefaultsSection />
        <SensitiveViewSection />
        <ClassPolicySection />
        <RegionMaskSection onChanged={refresh} />
        <LegendCard />
      </ScrollView>
    </SafeAreaView>
  );
};

/* -------------------------------------------------------------------------- */
/* 0. Status                                                                   */
/* -------------------------------------------------------------------------- */

const StatusCard: React.FC<{
  state: SessionReplayState | null;
  mask: RecordingMask | null;
  onRefresh: () => void;
}> = ({ state, mask, onRefresh }) => (
  <Section
    index="0"
    title="Recording state"
    subtitle="Session replay must be recording for anything below to reach the replay."
  >
    {state ? (
      <View style={styles.stateGrid}>
        <StateRow label="Status" value={state.status} />
        <StateRow
          label="Recording"
          value={state.isRecording ? 'Yes' : 'No'}
          color={state.isRecording ? COLORS.success : COLORS.danger}
        />
        <StateRow label="Sampling rate" value={String(state.samplingRate)} />
        <StateRow
          label="Rendering mode"
          value={state.renderingMode}
          color={
            state.renderingMode === RenderingMode.NATIVE
              ? COLORS.success
              : COLORS.warn
          }
        />
        <StateRow
          label="Active mask elements"
          value={mask ? String(mask.elements.length) : '0'}
        />
        <StateRow
          label="Platform"
          value={`${Platform.OS} ${Platform.Version}`}
        />
      </View>
    ) : (
      <Text style={styles.placeholder}>Loading…</Text>
    )}

    <View style={styles.buttonRow}>
      <TouchableOpacity
        style={[styles.button, styles.successButton]}
        onPress={async () => {
          await SplunkSessionReplay.instance.start();
          onRefresh();
        }}
      >
        <Text style={styles.buttonText}>Start</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, styles.dangerButton]}
        onPress={async () => {
          await SplunkSessionReplay.instance.stop();
          onRefresh();
        }}
      >
        <Text style={styles.buttonText}>Stop</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, styles.neutralButton]}
        onPress={onRefresh}
      >
        <Text style={styles.buttonText}>Refresh</Text>
      </TouchableOpacity>
    </View>

    <ActionButton
      title="Toggle rendering mode"
      subtitle="Wireframe-only drops region masks entirely, so switch back to native before section 4"
      onPress={async () => {
        const next =
          state?.renderingMode === RenderingMode.NATIVE
            ? RenderingMode.WIREFRAME_ONLY
            : RenderingMode.NATIVE;
        await SplunkSessionReplay.instance.setRenderingMode(next);
        onRefresh();
      }}
    />
  </Section>
);

/* -------------------------------------------------------------------------- */
/* 1. Out-of-the-box defaults                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Everything here is plain React Native with no session replay code attached.
 * It exists to show precisely where the native defaults start and stop.
 */
const DefaultsSection: React.FC = () => {
  const [password, setPassword] = useState('hunter2-not-a-real-password');
  const [card, setCard] = useState('4242 4242 4242 4242');
  const [ssn, setSsn] = useState('123-45-6789');
  const [notes, setNotes] = useState(
    'Patient reports recurring migraines. Prescribed sumatriptan 50mg.'
  );

  return (
    <Section
      index="1"
      title="Out of the box, no code"
      subtitle="The native SDKs mask text inputs because their backing native classes are on the default deny list. Nothing else is covered."
    >
      <Verdict tone="masked" label="Masked automatically">
        <Text style={styles.verdictWhy}>
          {'<TextInput>'} renders{' '}
          {Platform.OS === 'android'
            ? 'ReactEditText, a subclass of android.widget.EditText'
            : 'RCTUITextField / RCTUITextView, subclasses of UITextField / UITextView'}
          , and sensitivity resolution walks the superclass chain.
        </Text>

        <Field label="Password (secureTextEntry)">
          <TextInput
            style={styles.input}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            placeholderTextColor={COLORS.muted}
          />
        </Field>
        <Field label="Card number">
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={card}
            onChangeText={setCard}
            placeholderTextColor={COLORS.muted}
          />
        </Field>
        <Field label="National ID">
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={ssn}
            onChangeText={setSsn}
            placeholderTextColor={COLORS.muted}
          />
        </Field>
        <Field label="Clinical notes (multiline)">
          <TextInput
            style={[styles.input, styles.multiline]}
            multiline
            numberOfLines={3}
            value={notes}
            onChangeText={setNotes}
            placeholderTextColor={COLORS.muted}
          />
        </Field>
      </Verdict>

      <Verdict tone="leaking" label="Visible in the replay">
        <Text style={styles.verdictWhy}>
          {'<Text>'} and {'<Image>'} are not on any deny list. Displayed data is
          just as sensitive as typed data, so this is the gap teams most often
          miss.
        </Text>

        <Field label="Displayed customer record">
          <View style={styles.piiCard}>
            <Text style={styles.piiText}>Alex Morgan</Text>
            <Text style={styles.piiText}>alex.morgan@example.com</Text>
            <Text style={styles.piiText}>+1 (555) 014-8892</Text>
            <Text style={styles.piiText}>IBAN GB29 NWBK 6016 1331 9268 19</Text>
          </View>
        </Field>

        <Field label="Balances">
          <BalanceRow label="Checking" value="$12,345.67" />
          <BalanceRow label="Savings" value="$98,765.43" />
        </Field>

        <Field label="Uploaded identity document">
          <Image
            source={require('../assets/id-document.png')}
            style={styles.document}
            resizeMode="cover"
          />
        </Field>
      </Verdict>
    </Section>
  );
};

/* -------------------------------------------------------------------------- */
/* 2. <SensitiveView>                                                          */
/* -------------------------------------------------------------------------- */

const SensitiveViewSection: React.FC = () => {
  const [masked, setMasked] = useState(true);

  return (
    <Section
      index="2"
      title="<SensitiveView> wrapper"
      subtitle="Wraps any subtree and marks the native view behind it sensitive. Children need no session replay code of their own."
    >
      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>
          Mask the card below {masked ? '(on)' : '(off)'}
        </Text>
        <Switch
          value={masked}
          onValueChange={setMasked}
          trackColor={{ true: COLORS.accent, false: COLORS.border }}
        />
      </View>
      <Text style={styles.verdictWhy}>
        Flip this while recording. The same subtree switches between covered and
        readable in the replay, with no re-render of the content itself.
      </Text>

      <SensitiveView sensitive={masked} style={styles.demoCard}>
        <Text style={styles.demoCardTitle}>Payment method</Text>
        <Text style={styles.piiText}>Alex Morgan</Text>
        <Text style={styles.piiText}>4242 4242 4242 4242</Text>
        <Text style={styles.piiText}>Expires 04/29 · CVC 123</Text>
        <Image
          source={require('../assets/id-document.png')}
          style={styles.documentSmall}
          resizeMode="cover"
        />
      </SensitiveView>

      <ExemptionBlock />
    </Section>
  );
};

/**
 * Sensitivity is resolved per view - its own instance flag, then its own class,
 * then superclasses. No ancestor is consulted, so marking a *wrapper*
 * `sensitive={false}` does nothing for its children. To exempt an element from
 * a class-level rule the flag has to land on that element's own native view,
 * which means a ref and the imperative API.
 */
const ExemptionBlock: React.FC = () => {
  const imageRef = useRef<HostInstance>(null);
  const [exempt, setExempt] = useState(false);
  const [diagnostic, setDiagnostic] = useState<string | null>(null);

  const toggleExemption = useCallback(async () => {
    const tag = findNodeHandle(imageRef.current as never);
    if (tag == null) {
      setDiagnostic('findNodeHandle returned null for the image ref.');
      return;
    }

    const next = !exempt;
    const applied = next
      ? await SplunkSessionReplay.instance.setViewSensitivity(tag, false)
      : await SplunkSessionReplay.instance.clearViewSensitivity(tag);

    // Read the class rule back too, so it is obvious whether the exemption has
    // anything to override in the first place.
    const classState = await SplunkSessionReplay.instance
      .getClassSensitivity(NativeViewClass.IMAGE)
      .catch(() => Sensitivity.UNSET);

    setDiagnostic(
      `tag ${tag} · instance ${
        applied ? (next ? 'notSensitive' : 'cleared') : 'NOT APPLIED'
      } · ${NativeViewClass.IMAGE} is ${classState}`
    );

    if (applied) {
      setExempt(next);
    }
  }, [exempt]);

  return (
    <>
      <Text style={styles.blockLabel}>Exempting one element</Text>
      <Text style={styles.verdictWhy}>
        Per-instance sensitivity beats per-class, so a single element can opt
        out of an app-wide rule. Turn on "Mask all images" in section 3, then
        exempt the image below - it stays visible while the one in section 1
        goes under the pattern.
      </Text>
      <Text style={styles.verdictWhy}>
        The flag has to sit on the image's own native view, so this uses a ref
        rather than a wrapper. Wrapping does not work: sensitivity is resolved
        per view and never consults an ancestor.
      </Text>

      <Image
        ref={imageRef}
        source={require('../assets/id-document.png')}
        style={styles.documentSmall}
        resizeMode="cover"
      />

      <ActionButton
        title={exempt ? 'Remove exemption' : 'Exempt this image'}
        subtitle={
          exempt
            ? 'Back to following the class-level rule'
            : 'setViewSensitivity(tag, false) on this image only'
        }
        color={exempt ? COLORS.warn : COLORS.success}
        onPress={toggleExemption}
      />

      {diagnostic ? (
        <Text style={styles.measuredText}>{diagnostic}</Text>
      ) : null}
    </>
  );
};

/* -------------------------------------------------------------------------- */
/* 3. Class-level policy                                                       */
/* -------------------------------------------------------------------------- */

const TRACKED_CLASSES: { label: string; className: string }[] = [
  { label: '<Text>', className: NativeViewClass.TEXT },
  { label: '<Image>', className: NativeViewClass.IMAGE },
  { label: '<TextInput>', className: NativeViewClass.TEXT_INPUT },
  { label: 'WebView', className: NativeViewClass.WEB_VIEW },
];

const ClassPolicySection: React.FC = () => {
  const [policy, setPolicy] = useState<Record<string, Sensitivity>>({});

  const readBack = useCallback(async () => {
    const entries = await Promise.all(
      TRACKED_CLASSES.map(async ({ className }) => {
        try {
          return [
            className,
            await SplunkSessionReplay.instance.getClassSensitivity(className),
          ] as const;
        } catch {
          // WebView is only loadable once react-native-webview is installed.
          return [className, Sensitivity.UNSET] as const;
        }
      })
    );
    setPolicy(Object.fromEntries(entries));
  }, []);

  useEffect(() => {
    readBack();
  }, [readBack]);

  const run = useCallback(
    async (action: () => Promise<unknown>) => {
      try {
        await action();
      } catch (error) {
        Alert.alert('Class policy', String(error));
      }
      readBack();
    },
    [readBack]
  );

  return (
    <Section
      index="3"
      title="App-wide policy by native class"
      subtitle="Neither native SDK has a global 'mask all text' switch. This builds one out of the per-class API, so a single call covers every current and future instance."
    >
      <View style={styles.policyTable}>
        {TRACKED_CLASSES.map(({ label, className }) => (
          <View key={className} style={styles.policyRow}>
            <Text style={styles.policyLabel}>{label}</Text>
            <Text style={styles.policyClass} numberOfLines={1}>
              {className}
            </Text>
            <SensitivityPill value={policy[className] ?? Sensitivity.UNSET} />
          </View>
        ))}
      </View>

      <ActionButton
        title="Mask all text"
        subtitle="Covers section 1's customer record and balances"
        onPress={() => run(() => SplunkSessionReplay.instance.maskAllText())}
      />
      <ActionButton
        title="Mask all images"
        subtitle="Covers the identity document"
        onPress={() => run(() => SplunkSessionReplay.instance.maskAllImages())}
      />
      <ActionButton
        title="Re-mask web views"
        subtitle="Both underlying SDKs mask web views by default; the Splunk agents clear that at install. This puts it back."
        onPress={() => run(() => SplunkSessionReplay.instance.maskWebViews())}
      />
      <ActionButton
        title="Reset all class policy"
        subtitle="Back to SDK defaults - text and images visible again"
        color={COLORS.danger}
        onPress={() =>
          run(async () => {
            for (const { className } of TRACKED_CLASSES) {
              await SplunkSessionReplay.instance
                .clearClassSensitivity(className)
                .catch(() => {});
            }
          })
        }
      />
    </Section>
  );
};

const SensitivityPill: React.FC<{ value: Sensitivity }> = ({ value }) => {
  const tone =
    value === Sensitivity.SENSITIVE
      ? COLORS.success
      : value === Sensitivity.NOT_SENSITIVE
        ? COLORS.warn
        : COLORS.muted;
  const label =
    value === Sensitivity.SENSITIVE
      ? 'masked'
      : value === Sensitivity.NOT_SENSITIVE
        ? 'forced visible'
        : 'default';

  return (
    <View style={[styles.pill, { borderColor: tone }]}>
      <Text style={[styles.pillText, { color: tone }]}>{label}</Text>
    </View>
  );
};

/* -------------------------------------------------------------------------- */
/* 4. Region masks                                                             */
/* -------------------------------------------------------------------------- */

const RegionMaskSection: React.FC<{ onChanged: () => void }> = ({
  onChanged,
}) => {
  const targetRef = useRef<HostInstance>(null);
  const [measured, setMeasured] = useState<MaskRect | null>(null);

  /**
   * Region masks are screen-space, so the rect has to be measured rather than
   * guessed. `measureInWindow` reports React Native layout units, which is
   * what the mask API takes on both platforms - the bridge converts to the
   * device pixels Android needs internally.
   */
  const measure = useCallback(
    () =>
      new Promise<MaskRect | null>((resolve) => {
        const node = targetRef.current;
        if (!node) {
          resolve(null);
          return;
        }
        node.measureInWindow((x, y, width, height) => {
          const rect = { x, y, width, height };
          setMeasured(rect);
          resolve(rect);
        });
      }),
    []
  );

  const coverTarget = useCallback(async () => {
    const rect = await measure();
    if (!rect) return;
    await SplunkSessionReplay.instance.setRecordingMask({
      elements: [{ rect, type: MaskType.COVERING }],
    });
    onChanged();
  }, [measure, onChanged]);

  const coverScreenExceptTarget = useCallback(async () => {
    const rect = await measure();
    if (!rect) return;
    await SplunkSessionReplay.instance.setRecordingMask({
      elements: [
        {
          rect: { x: 0, y: 0, width: 10000, height: 10000 },
          type: MaskType.COVERING,
        },
        { rect, type: MaskType.ERASING },
      ],
    });
    onChanged();
  }, [measure, onChanged]);

  const clear = useCallback(async () => {
    await SplunkSessionReplay.instance.setRecordingMask(null);
    onChanged();
  }, [onChanged]);

  const inspect = useCallback(async () => {
    const current = await SplunkSessionReplay.instance.getRecordingMask();
    Alert.alert(
      'Active recording mask',
      current
        ? current.elements
            .map(
              (element, i) =>
                `[${i}] ${element.type} (${Math.round(element.rect.x)}, ${Math.round(
                  element.rect.y
                )}) ${Math.round(element.rect.width)}x${Math.round(element.rect.height)}`
            )
            .join('\n')
        : 'None - the whole screen is visible.'
    );
  }, []);

  return (
    <Section
      index="4"
      title="Region masks"
      subtitle="Screen-space rectangles, independent of the view tree. Useful for content you do not own, such as a third-party SDK's overlay."
    >
      <View ref={targetRef} collapsable={false} style={styles.targetCard}>
        <Text style={styles.demoCardTitle}>Region mask target</Text>
        <Text style={styles.piiText}>
          This card is measured at runtime, so the mask lines up on any screen
          size instead of relying on hardcoded coordinates.
        </Text>
        {measured ? (
          <Text style={styles.measuredText}>
            measured {Math.round(measured.x)}, {Math.round(measured.y)} ·{' '}
            {Math.round(measured.width)}x{Math.round(measured.height)} layout
            units
          </Text>
        ) : null}
      </View>

      <ActionButton
        title="Cover this card"
        subtitle="Measured rect, converted to each platform's mask units"
        onPress={coverTarget}
      />
      <ActionButton
        title="Cover everything except this card"
        subtitle="A covering element with an erasing element layered on top"
        onPress={coverScreenExceptTarget}
      />
      <ActionButton
        title="Inspect active mask"
        subtitle="Read the mask back from the native SDK"
        onPress={inspect}
      />
      <ActionButton
        title="Clear mask"
        subtitle="Remove all region masks"
        color={COLORS.danger}
        onPress={clear}
      />
    </Section>
  );
};

/* -------------------------------------------------------------------------- */
/* 5. Legend                                                                   */
/* -------------------------------------------------------------------------- */

const LegendCard: React.FC = () => (
  <Section
    index="5"
    title="What to look for in the replay"
    subtitle="Masking happens on device. Masked pixels are never encoded into the recording, so they never reach the network or the backend."
  >
    <LegendRow
      swatch={COLORS.success}
      title="Grey diagonal hatch"
      body="How both platforms render a masked area: a repeating light-grey tile with darker diagonal stripes."
    />
    <LegendRow
      swatch={COLORS.warn}
      title="Native mode vs wireframe mode"
      body="The hatch overlay is drawn in native rendering mode. In wireframe mode there is no video frame at all, and masked text is emitted as plain colour blocks instead of characters."
    />
    <LegendRow
      swatch={COLORS.accent}
      title="Precedence"
      body="Per-instance beats per-class, and per-class beats the SDK default. A <SensitiveView sensitive={false}> therefore wins over 'mask all text'."
    />
  </Section>
);

/* -------------------------------------------------------------------------- */
/* Shared pieces                                                               */
/* -------------------------------------------------------------------------- */

const Section: React.FC<
  React.PropsWithChildren<{ index: string; title: string; subtitle: string }>
> = ({ index, title, subtitle, children }) => (
  <View style={styles.card}>
    <View style={styles.sectionHeader}>
      <View style={styles.indexBadge}>
        <Text style={styles.indexBadgeText}>{index}</Text>
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
    </View>
    <Text style={styles.cardSubtitle}>{subtitle}</Text>
    {children}
  </View>
);

const Verdict: React.FC<
  React.PropsWithChildren<{ tone: 'masked' | 'leaking'; label: string }>
> = ({ tone, label, children }) => {
  const color = tone === 'masked' ? COLORS.success : COLORS.sensitive;
  return (
    <View style={[styles.verdict, { borderLeftColor: color }]}>
      <View style={[styles.verdictBadge, { backgroundColor: color }]}>
        <Text style={styles.verdictBadgeText}>{label}</Text>
      </View>
      {children}
    </View>
  );
};

const Field: React.FC<React.PropsWithChildren<{ label: string }>> = ({
  label,
  children,
}) => (
  <View style={styles.field}>
    <Text style={styles.fieldLabel}>{label}</Text>
    {children}
  </View>
);

const BalanceRow: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <View style={styles.balanceRow}>
    <Text style={styles.balanceLabel}>{label}</Text>
    <Text style={styles.balanceValue}>{value}</Text>
  </View>
);

const StateRow: React.FC<{ label: string; value: string; color?: string }> = ({
  label,
  value,
  color,
}) => (
  <View style={styles.stateRow}>
    <Text style={styles.stateLabel}>{label}</Text>
    <Text style={[styles.stateValue, color ? { color } : undefined]}>
      {value}
    </Text>
  </View>
);

const LegendRow: React.FC<{
  swatch: string;
  title: string;
  body: string;
}> = ({ swatch, title, body }) => (
  <View style={styles.legendRow}>
    <View style={[styles.legendSwatch, { backgroundColor: swatch }]} />
    <View style={styles.legendBody}>
      <Text style={styles.legendTitle}>{title}</Text>
      <Text style={styles.legendText}>{body}</Text>
    </View>
  </View>
);

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
  content: { padding: 12, paddingBottom: 48 },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  indexBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexBadgeText: { color: COLORS.text, fontSize: 12, fontWeight: '700' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, flex: 1 },
  cardSubtitle: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 6,
    marginBottom: 12,
    lineHeight: 17,
  },
  blockLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 16,
  },
  placeholder: { fontSize: 13, color: COLORS.muted, fontStyle: 'italic' },

  stateGrid: { gap: 2 },
  stateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  stateLabel: { fontSize: 13, color: COLORS.muted },
  stateValue: { fontSize: 13, fontWeight: '600', color: COLORS.text },

  buttonRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  successButton: { backgroundColor: COLORS.success },
  dangerButton: { backgroundColor: COLORS.danger },
  neutralButton: { backgroundColor: COLORS.accent },
  buttonText: { color: COLORS.text, fontWeight: '600', fontSize: 14 },

  verdict: {
    borderLeftWidth: 3,
    paddingLeft: 12,
    marginBottom: 18,
  },
  verdictBadge: {
    alignSelf: 'flex-start',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 8,
  },
  verdictBadgeText: {
    color: '#0F0F23',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  verdictWhy: {
    fontSize: 11,
    color: COLORS.muted,
    lineHeight: 16,
    marginBottom: 12,
  },

  field: { marginBottom: 12 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.sensitive,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: COLORS.input,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  multiline: { minHeight: 70, textAlignVertical: 'top' },

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
  document: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    backgroundColor: COLORS.input,
  },
  documentSmall: {
    width: '100%',
    height: 96,
    borderRadius: 8,
    marginTop: 10,
    backgroundColor: COLORS.input,
  },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  toggleLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  demoCard: {
    backgroundColor: COLORS.input,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.accent,
    marginBottom: 4,
  },
  demoCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.accent,
    marginBottom: 8,
  },

  policyTable: { marginBottom: 14, gap: 6 },
  policyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  policyLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    width: 82,
  },
  policyClass: { fontSize: 10, color: COLORS.muted, flex: 1 },
  pill: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  pillText: { fontSize: 10, fontWeight: '700' },

  targetCard: {
    backgroundColor: COLORS.input,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.warn,
    marginBottom: 12,
  },
  measuredText: {
    fontSize: 10,
    color: COLORS.warn,
    marginTop: 8,
    fontVariant: ['tabular-nums'],
  },

  legendRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  legendSwatch: { width: 4, borderRadius: 2 },
  legendBody: { flex: 1 },
  legendTitle: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  legendText: {
    fontSize: 11,
    color: COLORS.muted,
    lineHeight: 16,
    marginTop: 2,
  },

  actionButton: {
    backgroundColor: COLORS.input,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent,
  },
  actionTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  actionSubtitle: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
    lineHeight: 15,
  },
});
