/*
Copyright 2022 Splunk Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import {
  trace,
  context,
  Span,
  Attributes,
  diag,
  DiagConsoleLogger,
  DiagLogLevel,
} from '@opentelemetry/api';
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { _globalThis } from '@opentelemetry/core';
import {
  initializeNativeSdk,
  NativeSdKConfiguration,
  setNativeSessionId,
  testNativeCrash,
} from './native';
import ReacNativeSpanExporter from './exporting';
import GlobalAttributeAppender from './globalAttributeAppender';
import { instrumentXHR } from './instrumentations/xhr';
import { instrumentErrors, reportError } from './instrumentations/errors';
import { getResource, setGlobalAttributes } from './globalAttributes';
import { LOCATION_LATITUDE, LOCATION_LONGITUDE } from './splunkAttributeNames';
import { getSessionId, _generatenewSessionId } from './session';

export interface ReactNativeConfiguration {
  realm?: string;
  beaconEndpoint: string;
  rumAccessToken: string;
  applicationName: string;
  environment?: string;
  appStart?: boolean;
  debug?: boolean;
  isOtlp?: boolean;
  skipEncode?: boolean;
  skipAuth?: boolean;
}

interface SplunkRumType {
  appStart?: Span | undefined;
  appStartEnd: number | null;
  finishAppStart: () => void;
  init: (options: ReactNativeConfiguration) => SplunkRumType | undefined;
  provider?: WebTracerProvider;
  _generatenewSessionId: () => void;
  _testNativeCrash: () => void;
  reportError: (err: any, isFatal?: boolean) => void;
  setGlobalAttributes: (attributes: Attributes) => void;
  updateLocation: (latitude: number, longitude: number) => void;
}
const DEFAULT_CONFIG = {
  appStart: true,
};

export const SplunkRum: SplunkRumType = {
  appStartEnd: null,
  finishAppStart() {
    if (this.appStart && this.appStart.isRecording()) {
      this.appStart.end();
    } else {
      this.appStartEnd = Date.now();
    }
  },
  init(configugration: ReactNativeConfiguration) {
    //by default wants to use otlp
    if (!('OTEL_TRACES_EXPORTER' in _globalThis)) {
      (_globalThis as any).OTEL_TRACES_EXPORTER = 'none';
    }

    const config = {
      ...DEFAULT_CONFIG,
      ...configugration,
    };

    diag.setLogger(
      new DiagConsoleLogger(),
      config?.debug ? DiagLogLevel.DEBUG : DiagLogLevel.ERROR
    );

    const clientInit = Date.now();
    if (!config.applicationName) {
      diag.error('applicationName name is required.');
      return;
    }

    if (!config.realm && !config.beaconEndpoint) {
      diag.error('Either realm or beaconEndpoint is required.');
      return;
    }

    if (config.realm && !config.rumAccessToken) {
      diag.error('When sending data to Splunk rumAccessToken is required.');
      return;
    }

    addGlobalAttributesFromConf(config);
    const provider = new WebTracerProvider({});
    provider.addSpanProcessor(new GlobalAttributeAppender());
    provider.addSpanProcessor(
      new SimpleSpanProcessor(new ReacNativeSpanExporter())
    );

    provider.register({});
    this.provider = provider;
    const clientInitEnd = Date.now();

    instrumentXHR();
    instrumentErrors();

    const nativeInit = Date.now();
    const nativeSdkConf: NativeSdKConfiguration = {};

    if (config.realm) {
      nativeSdkConf.beaconEndpoint = `https://rum-ingest.${config.realm}.signalfx.com/v1/rum`;
    }

    if (config.beaconEndpoint) {
      nativeSdkConf.beaconEndpoint = config.beaconEndpoint;
    }
    nativeSdkConf.rumAccessToken = config.rumAccessToken;
    nativeSdkConf.isOtlp = config.isOtlp;
    nativeSdkConf.skipEncode = config.skipEncode;
    nativeSdkConf.skipAuth = config.skipAuth;
    nativeSdkConf.globalAttributes = { ...getResource() };

    diag.debug(
      'Initializing with: ',
      config.applicationName,
      nativeSdkConf.beaconEndpoint,
      nativeSdkConf.rumAccessToken,
      nativeSdkConf.isOtlp,
      nativeSdkConf.skipEncode,
      nativeSdkConf.skipAuth
    );

    initializeNativeSdk(nativeSdkConf).then((appStartTime) => {
      setNativeSessionId(getSessionId());
      diag.debug(
        'AppStart: native module start',
        appStartTime,
        new Date(appStartTime)
      );
      //TODO refactor appStart
      if (config.appStart) {
        const tracer = provider.getTracer('AppStart');
        const nativeInitEnd = Date.now();

        this.appStart = tracer.startSpan('AppStart', {
          startTime: appStartTime,
          attributes: {
            'component': 'appstart',
            'start.type': 'cold',
          },
        });

        //FIXME no need to have native init span probably
        const ctx = trace.setSpan(context.active(), this.appStart);
        context.with(ctx, () => {
          tracer
            .startSpan('nativeInit', { startTime: nativeInit })
            .end(nativeInitEnd);
          tracer
            .startSpan('clientInit', { startTime: clientInit })
            .end(clientInitEnd);
        });

        const defaultAppStartEnd = Date.now();
        if (this.appStartEnd !== null) {
          diag.debug('AppStart: real end');
          this.appStart.end(this.appStartEnd);
        } else {
          setTimeout(() => {
            //FIXME temp
            if (this.appStart && this.appStart.isRecording()) {
              if (this.appStartEnd) {
                this.appStart.end(this.appStartEnd);
                diag.debug('AppStart: real end in timeout');
              } else {
                this.appStart.end(defaultAppStartEnd);
                diag.debug(
                  'AppStart: timeout end',
                  new Date(defaultAppStartEnd)
                );
              }
            }
          }, 5000);
        }
      }
    });

    return this;
  },
  _generatenewSessionId: _generatenewSessionId,
  _testNativeCrash: testNativeCrash,
  reportError: reportError,
  setGlobalAttributes: setGlobalAttributes,
  updateLocation: updateLocation,
};

function addGlobalAttributesFromConf(config: ReactNativeConfiguration) {
  const confAttributes: Attributes = {};
  confAttributes.app = config.applicationName;

  if (config.environment) {
    confAttributes['deployment.environment'] = config.environment;
  }

  setGlobalAttributes(confAttributes);
}

function updateLocation(latitude: number, longitude: number) {
  setGlobalAttributes({
    [LOCATION_LATITUDE]: latitude,
    [LOCATION_LONGITUDE]: longitude,
  });
}
