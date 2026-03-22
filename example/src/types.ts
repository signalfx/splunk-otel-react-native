// Test action types and categories
export enum TestCategory {
  Crashes = 'crashes',
  Navigation = 'navigation',
  CustomTracking = 'customTracking',
  Performance = 'performance',
  Network = 'network',
  Session = 'session',
  GlobalAttributes = 'globalAttributes',
  EndpointConfiguration = 'endpointConfiguration',
  ApiTests = 'apiTests',
}

export enum MobilePlatform {
  Android = 'android',
  iOS = 'ios',
}

export interface TestAction {
  id: string;
  title: string;
  description: string;
  category: TestCategory;
  platforms: Set<MobilePlatform>;
  onTap: () => Promise<void>;
}

export interface TestResult {
  id: string;
  success: boolean;
  message: string;
  timestamp: Date;
}

export const platformLabels = (platforms: Set<MobilePlatform>): string => {
  if (platforms.size === 2) return 'Android • iOS';
  if (platforms.has(MobilePlatform.Android)) return 'Android';
  if (platforms.has(MobilePlatform.iOS)) return 'iOS';
  return 'Unknown';
};

export const categoryLabels: Record<TestCategory, string> = {
  [TestCategory.Crashes]: 'Crashes',
  [TestCategory.Navigation]: 'Navigation',
  [TestCategory.CustomTracking]: 'Custom Tracking',
  [TestCategory.Performance]: 'Performance',
  [TestCategory.Network]: 'Network',
  [TestCategory.Session]: 'Session',
  [TestCategory.GlobalAttributes]: 'Global Attributes',
  [TestCategory.EndpointConfiguration]: 'Endpoint Configuration',
  [TestCategory.ApiTests]: 'API Tests',
};
