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

import { trace, context, Span, Attributes } from '@opentelemetry/api';
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';

import {
  initializeNativeSdk,
  ReactNativeConfiguration,
  NativeSdKConfiguration,
} from './index';
import ReacNativeSpanExporter from './exporting';
import GlobalAttributeAppender from './globalAttributeAppender';
import { instrumentXHR } from './instrumentations/xhr';
import { instrumentErrors, reportError } from './instrumentations/errors';
import { setGlobalAttributes } from './globalAttributes';
import { _generatenewSessionId } from './session';

interface SplunkRumType {
  init: (options: ReactNativeConfiguration) => SplunkRumType | undefined;
  finishAppStart: () => void;
  _generatenewSessionId: () => void;
  reportError: (err: any, isFatal?: boolean) => void;
  provider?: WebTracerProvider;
  appStart?: Span;
  appStartEnd: number | null;
}

//FIXME
const enableAppStart = false;

export const SplunkRum: SplunkRumType = {
  appStartEnd: null,
  _generatenewSessionId: _generatenewSessionId,
  reportError: reportError,
  init(config: ReactNativeConfiguration) {
    console.log('CONFIG ', config);
    const clientInit = Date.now();
    if (!config.applicationName) {
      console.error('applicationName name is required.');
      return;
    }

    if (!config.realm && !config.beaconEndpoint) {
      console.error('Either realm or beaconEndpoint is required.');
      return;
    }

    if (config.realm && !config.rumAccessToken) {
      console.error('When sending data to Splunk rumAccessToken is required.');
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

    const tracer = provider.getTracer('appStart');
    const nativeInit = Date.now();
    const nativeSdkConf: NativeSdKConfiguration = {};

    if (config.realm) {
      nativeSdkConf.beaconEndpoint = `https://rum-ingest." + ${config.realm} + ".signalfx.com/v1/rum`;
    }

    if (config.beaconEndpoint) {
      nativeSdkConf.beaconEndpoint = config.beaconEndpoint;
    }
    nativeSdkConf.rumAccessToken = config.rumAccessToken;

    console.log(
      'Initializing with: ',
      config.applicationName,
      nativeSdkConf.beaconEndpoint,
      nativeSdkConf.rumAccessToken
    );

    initializeNativeSdk(nativeSdkConf).then((appStartTime) => {
      if (enableAppStart) {
        const nativeInitEnd = Date.now();
        const appStartTimeInt = parseInt(appStartTime, 10);

        this.appStart = tracer.startSpan('appStart', {
          startTime: appStartTimeInt,
          attributes: {
            component: 'appstart',
          },
        });
        console.log('APPStart: ', appStartTimeInt, new Date(appStartTimeInt));

        //FIXME no need to have native init span probably
        const ctx = trace.setSpan(context.active(), this.appStart);
        context.with(ctx, () => {
          tracer
            .startSpan('nativeInit', { startTime: nativeInit })
            .end(this.appStartEnd || nativeInitEnd);
          tracer
            .startSpan('clientInit', { startTime: clientInit })
            .end(clientInitEnd);
        });

        const defaultAppStartEnd = Date.now();
        if (this.appStartEnd !== null) {
          console.log('CLIENT:SplunkRum: end appstart with real end');
          this.appStart.end(this.appStartEnd);
        } else {
          setTimeout(() => {
            //FIXME temp
            if (this.appStart && this.appStart.isRecording()) {
              if (this.appStartEnd) {
                this.appStart.end(this.appStartEnd);
                console.log('CLIENT:SplunkRum:REALappStartEnd: ');
              } else {
                this.appStart.end(defaultAppStartEnd);
                console.log('CLIENT:SplunkRum:DEFAULTappStartEnd: ');
              }
            }
          }, 5000);
        }
      }
    });

    return this;
  },
  finishAppStart() {
    if (this.appStart && this.appStart.isRecording()) {
      this.appStart.end();
    } else {
      this.appStartEnd = Date.now();
    }
  },
};

function addGlobalAttributesFromConf(config: ReactNativeConfiguration) {
  const confAttributes: Attributes = {};
  confAttributes.app = config.applicationName;

  if (config.environment) {
    confAttributes['deployment.environment'] = config.environment;
  }

  setGlobalAttributes(confAttributes);
}
