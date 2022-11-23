import { Platform } from 'react-native';
import type { Attributes } from '@opentelemetry/api';
import type { ResourceAttributes } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { getSessionId } from './session';

let globalAttributes: Attributes = {};

//TODO get from semconv
const platformConstants = (Platform as any).constants;
const DEVICE_MODEL_NAME = 'device.model.name';
const DEVICE_MODEL_IDENTIFIER = 'device.model.identifier';
const OS_NAME = 'os.name';
const OS_TYPE = 'os.type';
const OS_VERSION = 'os.version';

console.log('CONSTANTTS: ', platformConstants);

// just for future where there may be a way to use proper resource
function getResource(): ResourceAttributes {
  let resourceAttrs = {
    // ...SDK_INFO,
    [SemanticResourceAttributes.TELEMETRY_SDK_NAME]:
      '@splunk/otel-react-native',
    [SemanticResourceAttributes.TELEMETRY_SDK_VERSION]: '0.1.0',
    // Splunk specific attributes
    'splunk.rumVersion': '0.1.0',
  };

  if (Platform.OS === 'ios') {
    resourceAttrs[OS_NAME] = 'iOS';
    resourceAttrs[OS_VERSION] = platformConstants.osVersion;
  } else {
    resourceAttrs[OS_NAME] = 'Android';
    resourceAttrs[OS_TYPE] = 'linux'; //matches android-sdk not sure if needed
    // Release should be Android version eg. 12 and Version is API version eg. 32
    resourceAttrs[OS_VERSION] = platformConstants.Release;
    resourceAttrs[DEVICE_MODEL_NAME] = platformConstants.Model;
    resourceAttrs[DEVICE_MODEL_IDENTIFIER] = platformConstants.Model;
  }

  return resourceAttrs;
}

globalAttributes = {
  ...getResource(),
};

//currently used for:
//splunk.rumSessionId
//screen.name
export function setGlobalAttributes(attrs: object) {
  globalAttributes = Object.assign(globalAttributes, attrs);
}

export function getGlobalAttributes(): Attributes {
  return Object.assign(globalAttributes, {
    'splunk.rumSessionId': getSessionId(),
  });
}
