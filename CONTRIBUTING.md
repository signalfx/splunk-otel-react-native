# Contributing Guidelines

Thank you for your interest in contributing to our repository! Whether it's a bug
report, new feature, question, or additional documentation, we greatly value
feedback and contributions from our community. Read through this document
before submitting any issues or pull requests to ensure we have all the
necessary information to effectively respond to your bug report or
contribution.

In addition to this document, please review our [Code of
Conduct](CODE_OF_CONDUCT.md). For any code of conduct questions or comments
please email oss@splunk.com.


## Getting started

## Opentelemetry

We use [OTEL JS](https://github.com/open-telemetry/opentelemetry-js) where we can.
Metro(React Native JS bundler) will by default use browser exports. As RN JS engine 
doesn't have browser APIs some of the functionality may not work. The only real workaround currently 
being used is overriding performance.timeOrigin as it is not present in RN. 
At some point we will probably have to upstream some react-native specific code to otel-js(metro seems to respect react-native field in 
package.json). We also don't use otel-js instrumentation class for now so you can't use otel-js instrumentations for web eg. XHR/Fetch. 
It may make sense to eventually use upstream XHR instrumentation. Beside XHR everything else seems to be quite RN specific anyways. 

Data sending is done in native side with disk caching using code from [splunk-otel-android ](https://github.com/signalfx/splunk-otel-android)
and [splunk-otel-ios](https://github.com/signalfx/splunk-otel-ios). When we figure out what we want to use from those libraries we will 
most likely use them directly. Currently to speed up development we just pick as we go. Eventually the goal is to upstream android and ios 
libraries also.

Some splunk specific attributes are used. Hopefully we will have semconv for them in the future.

## Reporting Security Issues

See [SECURITY.md](SECURITY.md#reporting-security-issues) for detailed instructions.

## Licensing

See the [LICENSE](LICENSE) file for our repository's licensing. We will ask you to
confirm the licensing of your contribution.

All contributors must execute the [Splunk Contributor License Agreement
(CLA) form](https://www.splunk.com/en_us/form/contributions.html).
