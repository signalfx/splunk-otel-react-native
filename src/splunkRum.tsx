import { trace, context, Span } from '@opentelemetry/api';
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';

import { initializeNativeSdk, ReactNativeConfiguration } from './index';
import ReacNativeSpanExporter from './exporting';
import { startXHRTracking } from './trackXHR';
import { startErrorTracking } from './trackErrors';
import { setGlobalAttributes } from './globalAttributes';

interface SplunkRumType {
  init: (options: ReactNativeConfiguration) => SplunkRumType;
  finishAppStart: () => void;
  provider?: WebTracerProvider;
  appStart?: Span;
  appStartEnd: number | null;
}

const enableAppStart = false;

export const SplunkRum: SplunkRumType = {
  appStartEnd: null,
  init(config: ReactNativeConfiguration) {
    //TODO check config for required props
    const clientInit = Date.now();
    setGlobalAttributes({ app: config.applicationName });

    const provider = new WebTracerProvider({});
    provider.addSpanProcessor(
      new SimpleSpanProcessor(new ReacNativeSpanExporter())
    );

    provider.register({});
    this.provider = provider;
    const clientInitEnd = Date.now();

    //FIXME make into instrumentations?
    startXHRTracking();
    startErrorTracking();

    const tracer = provider.getTracer('appStart');
    const nativeInit = Date.now();

    console.log('InitNative: ', config.applicationName, config.beaconEndpoint);

    initializeNativeSdk(config).then((appStartTime) => {
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
