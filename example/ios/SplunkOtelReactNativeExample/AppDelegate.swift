import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    // Register for remote notifications and enable background fetch so the OS can
    // wake/launch the process in the background. This reproduces the "background
    // launch inflates cold start" scenario for the Splunk RUM React Native SDK.
    application.registerForRemoteNotifications()
    application.setMinimumBackgroundFetchInterval(UIApplication.backgroundFetchIntervalMinimum)

    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "SplunkOtelReactNativeExample",
      in: window,
      launchOptions: launchOptions
    )

    return true
  }

  // Silent-push handler. When the app is not running, a content-available push
  // launches the process into the background: didFinishLaunching fires and this
  // callback runs, but didBecomeActive does NOT happen until the user foregrounds
  // the app later. The React Native AppStartHandler still anchors a cold start at
  // BSD process-start, so the whole background-residence window is reported as
  // cold-start latency. See tool/simulate_background_launch.sh.
  func application(
    _ application: UIApplication,
    didReceiveRemoteNotification userInfo: [AnyHashable: Any],
    fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void
  ) {
    completionHandler(.noData)
  }

  // Legacy background-fetch handler. Triggered on a real device via Xcode's
  // "Launch due to a background fetch event" scheme option (Product > Scheme >
  // Edit Scheme > Run > Options), which cold-launches the process in the background
  // without needing APNs credentials.
  func application(
    _ application: UIApplication,
    performFetchWithCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void
  ) {
    completionHandler(.noData)
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
