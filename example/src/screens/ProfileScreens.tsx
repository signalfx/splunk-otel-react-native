import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';

import type {
  ProfileStackParamList,
  RootStackParamList,
  TabParamList,
} from '../navigation/types';

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

export const ProfileHomeScreen = ({
  navigation,
}: NativeStackScreenProps<ProfileStackParamList, 'ProfileHome'>) => {
  const tabNavigation =
    navigation.getParent<BottomTabNavigationProp<TabParamList>>();
  const rootNavigation =
    tabNavigation?.getParent<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerCard}>
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.subtitle}>
            Use these actions to test profile stack navigation.
          </Text>
        </View>
        <ActionButton
          title="Open settings"
          description="Navigate deeper into the profile stack"
          onPress={() => navigation.navigate('ProfileSettings')}
        />
        <ActionButton
          title="Open preferences"
          description="Navigate with params"
          onPress={() =>
            navigation.navigate('ProfilePreferences', { origin: 'ProfileHome' })
          }
        />
        <ActionButton
          title="Open root modal"
          description="Present a modal from the root stack"
          onPress={() =>
            rootNavigation?.navigate('ModalInfo', { source: 'ProfileHome' })
          }
        />
        <ActionButton
          title="Switch to Navigation tab"
          description="Move focus to the Navigation lab"
          onPress={() =>
            tabNavigation?.navigate('NavigationTab', { screen: 'NavHome' })
          }
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export const ProfileSettingsScreen = ({
  navigation,
}: NativeStackScreenProps<ProfileStackParamList, 'ProfileSettings'>) => (
  <SafeAreaView style={styles.screen}>
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>
          Stack transitions inside the Profile navigator.
        </Text>
      </View>
      <ActionButton
        title="Push preferences"
        description="Push another screen onto the stack"
        onPress={() =>
          navigation.push('ProfilePreferences', { origin: 'ProfileSettings' })
        }
      />
      <ActionButton
        title="Reset to profile home"
        description="Reset stack to a single screen"
        onPress={() =>
          navigation.reset({
            index: 0,
            routes: [{ name: 'ProfileHome' }],
          })
        }
      />
      <ActionButton
        title="Go back"
        description="Pop the current screen"
        tone="secondary"
        onPress={() => navigation.goBack()}
      />
    </ScrollView>
  </SafeAreaView>
);

export const ProfilePreferencesScreen = ({
  navigation,
  route,
}: NativeStackScreenProps<ProfileStackParamList, 'ProfilePreferences'>) => {
  const tabNavigation =
    navigation.getParent<BottomTabNavigationProp<TabParamList>>();
  const { origin } = route.params;

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerCard}>
          <Text style={styles.title}>Preferences</Text>
          <Text style={styles.subtitle}>Origin: {origin}</Text>
        </View>
        <ActionButton
          title="Pop to top"
          description="Return to the profile home screen"
          onPress={() => navigation.popToTop()}
        />
        <ActionButton
          title="Switch to Tests tab"
          description="Move focus to the test actions"
          onPress={() =>
            tabNavigation?.navigate('TestsTab', { screen: 'Home' })
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
