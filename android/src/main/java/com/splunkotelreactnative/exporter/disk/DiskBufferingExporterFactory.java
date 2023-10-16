package com.splunkotelreactnative.exporter.disk;

import android.app.Application;
import android.content.ContextWrapper;

import androidx.annotation.Nullable;

import com.splunkotelreactnative.exporter.network.CurrentNetworkProvider;

import java.io.File;
import java.util.Collection;
import java.util.function.Supplier;

import io.opentelemetry.sdk.common.CompletableResultCode;
import io.opentelemetry.sdk.trace.data.SpanData;
import io.opentelemetry.sdk.trace.export.SpanExporter;
import zipkin2.reporter.Sender;
import zipkin2.reporter.okhttp3.OkHttpSender;

public class DiskBufferingExporterFactory {
  public static SpanExporter setupDiskBuffering(String endpoint, ContextWrapper application, int maxStorageUseMb) {
    CurrentNetworkProvider currentNetworkProvider = CurrentNetworkProvider.createAndStart((Application) application.getApplicationContext());

    Sender sender = OkHttpSender.newBuilder().endpoint(endpoint).build();
    File spanFilesPath = FileUtils.getSpansDirectory(application);
    BandwidthTracker bandwidthTracker = new BandwidthTracker();

    FileSender fileSender =
      FileSender.builder().sender(sender).bandwidthTracker(bandwidthTracker).build();
    DiskToZipkinExporter diskToZipkinExporter =
      DiskToZipkinExporter.builder()
        .connectionUtil(currentNetworkProvider)
        .fileSender(fileSender)
        .bandwidthTracker(bandwidthTracker)
        .spanFilesPath(spanFilesPath)
        .build();
    diskToZipkinExporter.startPolling();

    return new LazyInitSpanExporter(
      () ->
        ZipkinWriteToDiskExporterFactory.create(
          application, maxStorageUseMb));
  }

  private static class LazyInitSpanExporter implements SpanExporter {
    @Nullable
    private volatile SpanExporter delegate;
    private final Supplier<SpanExporter> s;

    public LazyInitSpanExporter(Supplier<SpanExporter> s) {
      this.s = s;
    }

    private SpanExporter getDelegate() {
      SpanExporter d = delegate;
      if (d == null) {
        synchronized (this) {
          d = delegate;
          if (d == null) {
            delegate = d = s.get();
          }
        }
      }
      return d;
    }

    @Override
    public CompletableResultCode export(Collection<SpanData> spans) {
      return getDelegate().export(spans);
    }

    @Override
    public CompletableResultCode flush() {
      return getDelegate().flush();
    }

    @Override
    public CompletableResultCode shutdown() {
      return getDelegate().shutdown();
    }
  }
}
