import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../navigation/types';

const ActionButton = ({
  title,
  description,
  onPress,
  tone = 'primary',
}: {
  title: string;
  description?: string;
  onPress: () => void;
  tone?: 'primary' | 'secondary';
}) => (
  <TouchableOpacity
    style={[
      styles.actionButton,
      tone === 'secondary' && styles.actionButtonSecondary,
    ]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={styles.actionTitle}>{title}</Text>
    {description ? (
      <Text style={styles.actionDescription}>{description}</Text>
    ) : null}
  </TouchableOpacity>
);

export const ModalInfoScreen = ({
  navigation,
  route,
}: NativeStackScreenProps<RootStackParamList, 'ModalInfo'>) => {
  const source = route.params?.source ?? 'unknown';

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerCard}>
          <Text style={styles.title}>Modal Screen</Text>
          <Text style={styles.subtitle}>Opened from: {source}</Text>
        </View>
        <ActionButton
          title="Dismiss modal"
          description="Close modal and return to previous screen"
          onPress={() => navigation.goBack()}
        />
        <ActionButton
          title="Open full screen modal"
          description="Present a full screen modal on top"
          onPress={() =>
            navigation.navigate('FullScreenModal', { source: 'ModalInfo' })
          }
        />
        <ActionButton
          title="Go to Navigation tab"
          description="Switch to navigation lab from modal"
          onPress={() =>
            navigation.navigate('Tabs', {
              screen: 'NavigationTab',
              params: { screen: 'NavHome' },
            })
          }
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export const FullScreenModalScreen = ({
  navigation,
  route,
}: NativeStackScreenProps<RootStackParamList, 'FullScreenModal'>) => {
  const source = route.params?.source ?? 'unknown';

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerCard}>
          <Text style={styles.title}>Full Screen Modal</Text>
          <Text style={styles.subtitle}>Opened from: {source}</Text>
        </View>
        <ActionButton
          title="Dismiss modal"
          description="Close full screen modal"
          onPress={() => navigation.goBack()}
        />
        <ActionButton
          title="Go to Tests tab"
          description="Switch to tests tab from modal"
          onPress={() =>
            navigation.navigate('Tabs', {
              screen: 'TestsTab',
              params: { screen: 'Home' },
            })
          }
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  content: {
    padding: 16,
    gap: 10,
  },
  headerCard: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#607D8B',
  },
  actionButton: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#3949AB',
  },
  actionButtonSecondary: {
    backgroundColor: '#607D8B',
  },
  actionTitle: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  actionDescription: {
    color: '#E3F2FD',
    fontSize: 12,
    marginTop: 4,
  },
});
