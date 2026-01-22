import { useMemo } from 'react';
import {
  FlatList,
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
  NavigationStackParamList,
  RootStackParamList,
  TabParamList,
} from '../navigation/types';

type Scenario = {
  id: string;
  title: string;
  description: string;
  onPress: () => void;
};

const ScenarioCard = ({ title, description, onPress }: Scenario) => (
  <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
    <Text style={styles.cardTitle}>{title}</Text>
    <Text style={styles.cardDescription}>{description}</Text>
  </TouchableOpacity>
);

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

export const NavigationHomeScreen = ({
  navigation,
}: NativeStackScreenProps<NavigationStackParamList, 'NavHome'>) => {
  const tabNavigation =
    navigation.getParent<BottomTabNavigationProp<TabParamList>>();
  const rootNavigation =
    tabNavigation?.getParent<NativeStackNavigationProp<RootStackParamList>>();

  const scenarios = useMemo<Scenario[]>(() => {
    const makeDetailParams = () => {
      const itemId = Math.floor(Math.random() * 900) + 100;
      return { itemId, title: `Item ${itemId}` };
    };

    return [
      {
        id: 'stack-list',
        title: 'Stack: Push list screen',
        description: 'Push the list screen onto the stack',
        onPress: () => navigation.navigate('ItemList'),
      },
      {
        id: 'stack-detail',
        title: 'Stack: Push detail screen',
        description: 'Push a detail screen with route params',
        onPress: () => navigation.push('ItemDetail', makeDetailParams()),
      },
      {
        id: 'stack-double',
        title: 'Stack: Push detail twice',
        description: 'Push two instances of the same screen',
        onPress: () => {
          navigation.push('ItemDetail', makeDetailParams());
          navigation.push('ItemDetail', makeDetailParams());
        },
      },
      {
        id: 'stack-replace',
        title: 'Stack: Replace with checkout',
        description: 'Replace current screen with checkout',
        onPress: () =>
          navigation.replace('Checkout', {
            total: 42.5,
            source: 'NavHome',
          }),
      },
      {
        id: 'stack-reset',
        title: 'Stack: Reset to landing',
        description: 'Reset stack to a single landing screen',
        onPress: () =>
          navigation.reset({
            index: 0,
            routes: [
              {
                name: 'ResetLanding',
                params: { seed: `reset-${Date.now()}` },
              },
            ],
          }),
      },
      {
        id: 'modal',
        title: 'Root: Present modal',
        description: 'Open modal from the root stack',
        onPress: () =>
          rootNavigation?.navigate('ModalInfo', { source: 'NavigationLab' }),
      },
      {
        id: 'full-modal',
        title: 'Root: Full screen modal',
        description: 'Open full screen modal from root stack',
        onPress: () =>
          rootNavigation?.navigate('FullScreenModal', {
            source: 'NavigationLab',
          }),
      },
      {
        id: 'tab-profile',
        title: 'Tabs: Switch to Profile',
        description: 'Move focus to another tab',
        onPress: () =>
          tabNavigation?.navigate('ProfileTab', { screen: 'ProfileHome' }),
      },
      {
        id: 'tab-tests',
        title: 'Tabs: Switch to Tests',
        description: 'Return to the test actions tab',
        onPress: () => tabNavigation?.navigate('TestsTab', { screen: 'Home' }),
      },
    ];
  }, [navigation, rootNavigation, tabNavigation]);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Navigation Lab</Text>
          <Text style={styles.subtitle}>
            Run stack, modal, reset, and tab navigation scenarios to trigger
            automatic screen detection.
          </Text>
        </View>
        {scenarios.map((scenario) => (
          <ScenarioCard key={scenario.id} {...scenario} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export const ItemListScreen = ({
  navigation,
}: NativeStackScreenProps<NavigationStackParamList, 'ItemList'>) => {
  const items = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) => {
        const itemId = index + 1;
        return { itemId, title: `Item ${itemId}` };
      }),
    []
  );

  return (
    <SafeAreaView style={styles.screen}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.itemId.toString()}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.listItem}
            onPress={() =>
              navigation.navigate('ItemDetail', {
                itemId: item.itemId,
                title: item.title,
              })
            }
            activeOpacity={0.7}
          >
            <Text style={styles.listItemTitle}>{item.title}</Text>
            <Text style={styles.listItemSubtitle}>
              Tap to open details with params
            </Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
};

export const ItemDetailScreen = ({
  navigation,
  route,
}: NativeStackScreenProps<NavigationStackParamList, 'ItemDetail'>) => {
  const tabNavigation =
    navigation.getParent<BottomTabNavigationProp<TabParamList>>();
  const rootNavigation =
    tabNavigation?.getParent<NativeStackNavigationProp<RootStackParamList>>();
  const { itemId, title } = route.params;
  const nextId = itemId + 1;

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.detailContent}>
        <View style={styles.detailCard}>
          <Text style={styles.detailTitle}>{title}</Text>
          <Text style={styles.detailSubtitle}>Item ID: {itemId}</Text>
        </View>

        <ActionButton
          title="Push another detail"
          description={`Push detail for item ${nextId}`}
          onPress={() =>
            navigation.push('ItemDetail', {
              itemId: nextId,
              title: `Item ${nextId}`,
            })
          }
        />
        <ActionButton
          title="Replace with checkout"
          description="Replace current screen and remove it from stack"
          onPress={() =>
            navigation.replace('Checkout', {
              total: Math.round(itemId * 1.25),
              source: `ItemDetail:${itemId}`,
            })
          }
        />
        <ActionButton
          title="Reset to landing"
          description="Reset stack to a single landing screen"
          onPress={() =>
            navigation.reset({
              index: 0,
              routes: [
                {
                  name: 'ResetLanding',
                  params: { seed: `from-item-${itemId}` },
                },
              ],
            })
          }
        />
        <ActionButton
          title="Open root modal"
          description="Present modal from the root stack"
          onPress={() =>
            rootNavigation?.navigate('ModalInfo', {
              source: `ItemDetail:${itemId}`,
            })
          }
        />
        <ActionButton
          title="Pop to top"
          description="Return to first screen in this stack"
          tone="secondary"
          onPress={() => navigation.popToTop()}
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
};

export const CheckoutScreen = ({
  navigation,
  route,
}: NativeStackScreenProps<NavigationStackParamList, 'Checkout'>) => {
  const tabNavigation =
    navigation.getParent<BottomTabNavigationProp<TabParamList>>();
  const rootNavigation =
    tabNavigation?.getParent<NativeStackNavigationProp<RootStackParamList>>();
  const { total, source } = route.params;

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.detailContent}>
        <View style={styles.detailCard}>
          <Text style={styles.detailTitle}>Checkout</Text>
          <Text style={styles.detailSubtitle}>Total: ${total}</Text>
          <Text style={styles.detailSubtitle}>
            Source: {source ?? 'unknown'}
          </Text>
        </View>

        <ActionButton
          title="Complete checkout"
          description="Reset stack back to navigation home"
          onPress={() =>
            navigation.reset({
              index: 0,
              routes: [{ name: 'NavHome' }],
            })
          }
        />
        <ActionButton
          title="Open full screen modal"
          description="Present full screen modal from root"
          onPress={() =>
            rootNavigation?.navigate('FullScreenModal', {
              source: 'Checkout',
            })
          }
        />
        <ActionButton
          title="Switch to Tests tab"
          description="Move to the test actions tab"
          onPress={() =>
            tabNavigation?.navigate('TestsTab', { screen: 'Home' })
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
};

export const ResetLandingScreen = ({
  navigation,
  route,
}: NativeStackScreenProps<NavigationStackParamList, 'ResetLanding'>) => {
  const tabNavigation =
    navigation.getParent<BottomTabNavigationProp<TabParamList>>();
  const { seed } = route.params;

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.detailContent}>
        <View style={styles.detailCard}>
          <Text style={styles.detailTitle}>Reset Landing</Text>
          <Text style={styles.detailSubtitle}>Seed: {seed}</Text>
        </View>

        <ActionButton
          title="Go to navigation home"
          description="Navigate to the lab home screen"
          onPress={() => navigation.navigate('NavHome')}
        />
        <ActionButton
          title="Push list screen"
          description="Start a new stack from the list screen"
          onPress={() => navigation.navigate('ItemList')}
        />
        <ActionButton
          title="Switch to Profile tab"
          description="Change active tab to Profile"
          onPress={() =>
            tabNavigation?.navigate('ProfileTab', { screen: 'ProfileHome' })
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
  scrollContent: {
    padding: 16,
  },
  header: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#546E7A',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    color: '#607D8B',
  },
  listContent: {
    padding: 16,
    gap: 10,
  },
  listItem: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  listItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 4,
  },
  listItemSubtitle: {
    fontSize: 12,
    color: '#607D8B',
  },
  detailContent: {
    padding: 16,
    gap: 10,
  },
  detailCard: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 4,
  },
  detailSubtitle: {
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
