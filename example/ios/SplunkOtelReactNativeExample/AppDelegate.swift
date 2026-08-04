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

    BackgroundLaunchProbe.shared.logDidFinishLaunching(application: application, launchOptions: launchOptions)

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

  func applicationDidBecomeActive(_ application: UIApplication) {
    BackgroundLaunchProbe.shared.logDidBecomeActive()
  }

  // Silent-push handler. When the app is not running, a content-available push
  // launches the process into the background: `didFinishLaunching` fires and this
  // callback runs, but `didBecomeActive` does NOT happen until the user foregrounds
  // the app later. The React Native AppStartHandler still anchors a cold start at
  // BSD process-start, so the whole background-residence window is reported as
  // cold-start latency.
  func application(
    _ application: UIApplication,
    didReceiveRemoteNotification userInfo: [AnyHashable: Any],
    fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void
  ) {
    BackgroundLaunchProbe.shared.logDidReceiveRemoteNotification(application: application)
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
    BackgroundLaunchProbe.shared.logDidPerformBackgroundFetch(application: application)
    completionHandler(.noData)
  }

  func application(
    _ application: UIApplication,
    didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
  ) {
    BackgroundLaunchProbe.shared.log("Registered for remote notifications (token bytes: \(deviceToken.count))")
  }

  func application(
    _ application: UIApplication,
    didFailToRegisterForRemoteNotificationsWithError error: Error
  ) {
    // Expected on the Simulator without a real APNs environment; silent pushes are
    // still delivered locally via `xcrun simctl push`.
    BackgroundLaunchProbe.shared.log("Failed to register for remote notifications: \(error.localizedDescription)")
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

/// Debug helper that logs lifecycle timing for the background-launch cold-start
/// simulation. It reads the real BSD process-start time (the same anchor the native
/// AppStartHandler uses for cold starts) so we can predict the duration the SDK will
/// report.
final class BackgroundLaunchProbe {

  static let shared = BackgroundLaunchProbe()

  private let prefix = "[BG-LAUNCH-PROBE]"

  private init() {}

  func logDidFinishLaunching(application: UIApplication, launchOptions: [UIApplication.LaunchOptionsKey: Any]?) {
    let state = Self.description(for: application.applicationState)
    let launchedFromPush = launchOptions?[.remoteNotification] != nil
    log("didFinishLaunching — applicationState=\(state), launchedFromRemoteNotification=\(launchedFromPush)")
    if let processStart = Self.processStartDate() {
      log("Process start (BSD, cold-start anchor): \(Self.format(processStart))")
      log("Elapsed since process start: \(String(format: "%.3f", Date().timeIntervalSince(processStart)))s")
    }
  }

  func logDidReceiveRemoteNotification(application: UIApplication) {
    let state = Self.description(for: application.applicationState)
    log("didReceiveRemoteNotification (silent push) — applicationState=\(state)")
  }

  func logDidPerformBackgroundFetch(application: UIApplication) {
    let state = Self.description(for: application.applicationState)
    log("performFetch (background fetch) — applicationState=\(state)")
  }

  func logDidBecomeActive() {
    let now = Date()
    log("didBecomeActive at \(Self.format(now))")
    guard let processStart = Self.processStartDate() else {
      return
    }

    let delta = now.timeIntervalSince(processStart)

    log("process-start -> didBecomeActive delta: \(String(format: "%.3f", delta))s")
    log("=> If classified COLD, the SDK will report an AppStart span of ~\(String(format: "%.3f", delta))s")
  }

  func log(_ message: String) {
    // Intentionally unconditional: this is a demo/example app and the probe output
    // is the primary way to observe the background-launch cold-start simulation.
    NSLog("%@ %@", prefix, message)
  }

  // MARK: - Process start (BSD)

  /// Returns the real process-start time via `sysctl(KERN_PROC_PID)`, mirroring the
  /// native SDK's cold-start anchor.
  private static func processStartDate() -> Date? {
    var info = kinfo_proc()
    var size = MemoryLayout<kinfo_proc>.stride
    var mib: [Int32] = [CTL_KERN, KERN_PROC, KERN_PROC_PID, getpid()]

    let result = mib.withUnsafeMutableBufferPointer { pointer -> Int32 in
      sysctl(pointer.baseAddress, u_int(pointer.count), &info, &size, nil, 0)
    }

    guard result == 0 else {
      return nil
    }

    let startTime = info.kp_proc.p_starttime
    let seconds = TimeInterval(startTime.tv_sec)
    let microseconds = TimeInterval(startTime.tv_usec) / 1_000_000

    return Date(timeIntervalSince1970: seconds + microseconds)
  }

  private static func description(for state: UIApplication.State) -> String {
    switch state {
    case .active:
      return "active"
    case .inactive:
      return "inactive"
    case .background:
      return "background"
    @unknown default:
      return "unknown"
    }
  }

  private static func format(_ date: Date) -> String {
    let formatter = ISO8601DateFormatter()
    formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]

    return formatter.string(from: date)
  }
}
