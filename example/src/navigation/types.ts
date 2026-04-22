import type { NavigatorScreenParams } from '@react-navigation/native';

export type TestsStackParamList = {
  Home: undefined;
};

export type NavigationStackParamList = {
  NavHome: undefined;
  ItemList: undefined;
  ItemDetail: { itemId: number; title: string };
  Checkout: { total: number; source?: string };
  ResetLanding: { seed: string };
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  ProfileSettings: undefined;
  ProfilePreferences: { origin: string };
};

export type SessionReplayStackParamList = {
  SessionReplayLab: undefined;
};

export type TabParamList = {
  TestsTab: NavigatorScreenParams<TestsStackParamList> | undefined;
  SessionReplayTab:
    | NavigatorScreenParams<SessionReplayStackParamList>
    | undefined;
  NavigationTab: NavigatorScreenParams<NavigationStackParamList> | undefined;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList> | undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList>;
  ModalInfo: { source?: string } | undefined;
  FullScreenModal: { source?: string } | undefined;
};
