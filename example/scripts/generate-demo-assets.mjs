/*
 * Copyright 2026 Splunk Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*
 * Generates the static image fixture used by the session replay demo screen.
 *
 * The demo needs a real <Image> to show that images are not masked by default,
 * and it has to work with no network. Rather than checking in an opaque binary,
 * the asset is drawn here and can be regenerated with
 * `node scripts/generate-demo-assets.mjs`.
 */

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, '..', 'src', 'assets');

let crcTable = null;

function crc32(buf) {
  if (!crcTable) {
    crcTable = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      crcTable[n] = c;
    }
  }
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return crc ^ -1;
}

/** Minimal RGBA PNG encoder. */
function encodePng(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (width * 4 + 1);
    raw[rowStart] = 0; // filter type: none
    rgba.copy(raw, rowStart + 1, y * width * 4, (y + 1) * width * 4);
  }

  const chunk = (type, data) => {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(typeAndData) >>> 0);
    return Buffer.concat([length, typeAndData, crc]);
  };

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** Tiny drawing surface. */
function createCanvas(width, height) {
  const data = Buffer.alloc(width * height * 4);
  const set = (x, y, [r, g, b, a = 255]) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const i = (y * width + x) * 4;
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
    data[i + 3] = a;
  };
  return {
    data,
    fill(color) {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) set(x, y, color);
      }
    },
    rect(x0, y0, w, h, color) {
      for (let y = y0; y < y0 + h; y++) {
        for (let x = x0; x < x0 + w; x++) set(x, y, color);
      }
    },
    roundedRect(x0, y0, w, h, radius, color) {
      for (let y = y0; y < y0 + h; y++) {
        for (let x = x0; x < x0 + w; x++) {
          const dx = Math.max(x0 + radius - x, x - (x0 + w - 1 - radius), 0);
          const dy = Math.max(y0 + radius - y, y - (y0 + h - 1 - radius), 0);
          if (dx * dx + dy * dy <= radius * radius) set(x, y, color);
        }
      }
    },
    circle(cx, cy, r, color) {
      for (let y = cy - r; y <= cy + r; y++) {
        for (let x = cx - r; x <= cx + r; x++) {
          const dx = x - cx;
          const dy = y - cy;
          if (dx * dx + dy * dy <= r * r) set(x, y, color);
        }
      }
    },
  };
}

/**
 * A stand-in for a scanned identity document: portrait, header band and text
 * lines. Recognisable at a glance in a replay without containing real data.
 */
function drawIdDocument() {
  const width = 640;
  const height = 400;
  const canvas = createCanvas(width, height);

  const paper = [246, 247, 251];
  const band = [61, 90, 254];
  const ink = [58, 62, 84];
  const faint = [198, 203, 219];
  const portrait = [148, 163, 199];

  canvas.fill(paper);
  canvas.rect(0, 0, width, 64, band);
  canvas.rect(0, height - 10, width, 10, band);

  for (let i = 0; i < 5; i++) {
    canvas.roundedRect(28 + i * 62, 26, 46, 12, 6, [255, 255, 255]);
  }

  canvas.roundedRect(32, 96, 176, 224, 12, faint);
  canvas.roundedRect(40, 104, 160, 208, 10, [223, 228, 240]);
  canvas.circle(120, 176, 48, portrait);
  canvas.roundedRect(60, 236, 120, 90, 44, portrait);

  const rows = [
    [120, 300],
    [104, 220],
    [124, 260],
    [96, 180],
    [116, 300],
  ];
  rows.forEach(([labelWidth, valueWidth], index) => {
    const y = 108 + index * 44;
    canvas.roundedRect(240, y, labelWidth, 10, 5, faint);
    canvas.roundedRect(240, y + 18, valueWidth, 14, 7, ink);
  });

  for (let x = 0; x < 150; x++) {
    const y = 344 + Math.round(Math.sin(x / 11) * 7);
    canvas.rect(240 + x, y, 3, 3, ink);
  }

  return { width, height, data: canvas.data };
}

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const doc = drawIdDocument();
const target = path.join(OUTPUT_DIR, 'id-document.png');
fs.writeFileSync(target, encodePng(doc.width, doc.height, doc.data));
console.log(`Wrote ${target} (${doc.width}x${doc.height})`);
