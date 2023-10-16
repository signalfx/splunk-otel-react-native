/*
 * Copyright The OpenTelemetry Authors
 * SPDX-License-Identifier: Apache-2.0
 */

package com.splunkotelreactnative.exporter.network;

interface NetworkChangeListener {

  void onNetworkChange(CurrentNetwork currentNetwork);
}
