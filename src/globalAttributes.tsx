import { Platform } from 'react-native';
import type { Attributes } from '@opentelemetry/api';
import type { ResourceAttributes } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { getSession } from './session';

let globalAttributes: Attributes = {};

const platformConstants = (Platform as any).constants;
const DEVICE_MODEL_NAME = 'device.model.name';
const DEVICE_MODEL_IDENTIFIER = 'device.model.identifier';
const OS_NAME = 'os.name';
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
    'splunk.rumSessionId': getSession().id,
  };

  if (Platform.OS === 'ios') {
    resourceAttrs = {
      ...resourceAttrs,
      ...{
        [DEVICE_MODEL_NAME]: 'ios-emulator', //FIXME get proper model
        [DEVICE_MODEL_IDENTIFIER]: 'ios-emulator',
        [OS_NAME]: 'iOS',
        [OS_VERSION]: platformConstants.Release,
      },
    };
  } else {
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

export function getGlobalAttributes() {
  return globalAttributes;
}
