import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { HomeScreen } from '../screens/HomeScreen';
import {
  CheckoutScreen,
  ItemDetailScreen,
  ItemListScreen,
  NavigationHomeScreen,
  ResetLandingScreen,
} from '../screens/NavigationLabScreens';
import {
  ProfileHomeScreen,
  ProfilePreferencesScreen,
  ProfileSettingsScreen,
} from '../screens/ProfileScreens';
import {
  FullScreenModalScreen,
  ModalInfoScreen,
} from '../screens/ModalScreens';
import { SessionReplayLabScreen } from '../screens/SessionReplayLabScreen';
import type {
  NavigationStackParamList,
  ProfileStackParamList,
  RootStackParamList,
  SessionReplayStackParamList,
  TabParamList,
  TestsStackParamList,
} from './types';

type RootNavigatorProps = {
  installed: boolean;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();
const TestsStack = createNativeStackNavigator<TestsStackParamList>();
const NavigationStack = createNativeStackNavigator<NavigationStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
const SessionReplayStack =
  createNativeStackNavigator<SessionReplayStackParamList>();

const TestsStackNavigator = ({ installed }: RootNavigatorProps) => (
  <TestsStack.Navigator screenOptions={{ headerShown: false }}>
    <TestsStack.Screen name="Home">
      {(props) => <HomeScreen {...props} installed={installed} />}
    </TestsStack.Screen>
  </TestsStack.Navigator>
);

const NavigationStackNavigator = () => (
  <NavigationStack.Navigator>
    <NavigationStack.Screen
      name="NavHome"
      component={NavigationHomeScreen}
      options={{ title: 'Navigation Lab' }}
    />
    <NavigationStack.Screen
      name="ItemList"
      component={ItemListScreen}
      options={{ title: 'Item List' }}
    />
    <NavigationStack.Screen
      name="ItemDetail"
      component={ItemDetailScreen}
      options={({ route }) => ({ title: route.params.title })}
    />
    <NavigationStack.Screen
      name="Checkout"
      component={CheckoutScreen}
      options={{ title: 'Checkout' }}
    />
    <NavigationStack.Screen
      name="ResetLanding"
      component={ResetLandingScreen}
      options={{ title: 'Reset Landing' }}
    />
  </NavigationStack.Navigator>
);

const ProfileStackNavigator = () => (
  <ProfileStack.Navigator>
    <ProfileStack.Screen
      name="ProfileHome"
      component={ProfileHomeScreen}
      options={{ title: 'Profile' }}
    />
    <ProfileStack.Screen
      name="ProfileSettings"
      component={ProfileSettingsScreen}
      options={{ title: 'Settings' }}
    />
    <ProfileStack.Screen
      name="ProfilePreferences"
      component={ProfilePreferencesScreen}
      options={{ title: 'Preferences' }}
    />
  </ProfileStack.Navigator>
);

const SessionReplayStackNavigator = () => (
  <SessionReplayStack.Navigator>
    <SessionReplayStack.Screen
      name="SessionReplayLab"
      component={SessionReplayLabScreen}
      options={{ title: 'Session Replay Lab' }}
    />
  </SessionReplayStack.Navigator>
);

const MainTabs = ({ installed }: RootNavigatorProps) => (
  <Tab.Navigator screenOptions={{ headerShown: false }}>
    <Tab.Screen name="TestsTab" options={{ title: 'Tests' }}>
      {() => <TestsStackNavigator installed={installed} />}
    </Tab.Screen>
    <Tab.Screen
      name="SessionReplayTab"
      component={SessionReplayStackNavigator}
      options={{ title: 'Replay' }}
    />
    <Tab.Screen
      name="NavigationTab"
      component={NavigationStackNavigator}
      options={{ title: 'Navigation' }}
    />
    <Tab.Screen
      name="ProfileTab"
      component={ProfileStackNavigator}
      options={{ title: 'Profile' }}
    />
  </Tab.Navigator>
);

export const RootNavigator = ({ installed }: RootNavigatorProps) => (
  <RootStack.Navigator>
    <RootStack.Screen name="Tabs" options={{ headerShown: false }}>
      {() => <MainTabs installed={installed} />}
    </RootStack.Screen>
    <RootStack.Screen
      name="ModalInfo"
      component={ModalInfoScreen}
      options={{ presentation: 'modal', title: 'Modal' }}
    />
    <RootStack.Screen
      name="FullScreenModal"
      component={FullScreenModalScreen}
      options={{ presentation: 'fullScreenModal', title: 'Full Screen Modal' }}
    />
  </RootStack.Navigator>
);
