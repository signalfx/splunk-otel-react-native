import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { TestCategory, categoryLabels, type TestAction } from '../types';
import { TestActionCard } from './TestActionCard';
import { DeviceInfoHeader } from './DeviceInfoHeader';

interface TestActionsComponentProps {
  actions: TestAction[];
}

export const TestActionsComponent: React.FC<TestActionsComponentProps> = ({
  actions,
}) => {
  const groupedActions = useMemo(() => {
    const groups: Record<TestCategory, TestAction[]> = {
      [TestCategory.Crashes]: [],
      [TestCategory.Navigation]: [],
      [TestCategory.CustomTracking]: [],
      [TestCategory.Performance]: [],
      [TestCategory.Network]: [],
      [TestCategory.Session]: [],
      [TestCategory.GlobalAttributes]: [],
      [TestCategory.EndpointConfiguration]: [],
      [TestCategory.ApiTests]: [],
    };

    actions.forEach((action) => {
      groups[action.category].push(action);
    });

    return groups;
  }, [actions]);

  const orderedCategories = [
    TestCategory.ApiTests,
    TestCategory.Crashes,
    TestCategory.Performance,
    TestCategory.Network,
    TestCategory.Navigation,
    TestCategory.CustomTracking,
    TestCategory.Session,
    TestCategory.EndpointConfiguration,
    TestCategory.GlobalAttributes,
  ];

  return (
    <View style={styles.container}>
      <DeviceInfoHeader />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {orderedCategories.map((category) => {
          const categoryActions = groupedActions[category];
          if (categoryActions.length === 0) return null;

          return (
            <View key={category} style={styles.section}>
              <Text style={styles.sectionTitle}>
                {categoryLabels[category]}
              </Text>
              {categoryActions.map((action) => (
                <TestActionCard key={action.id} action={action} />
              ))}
            </View>
          );
        })}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#3949AB',
    marginBottom: 8,
    marginLeft: 4,
  },
  bottomPadding: {
    height: 40,
  },
});
