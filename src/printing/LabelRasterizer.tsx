import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { toByteArray } from 'base64-js';
import QRCode from 'qrcode';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { captureRef, type ViewShotRef } from 'react-native-view-shot';
import * as UPNG from 'upng-js';

import { colors, fonts } from '../theme';
import type { AppSettings, LabelOption, PrintableLabel } from '../types';
import { thresholdRgbaToBitmap, type MonochromeBitmap } from './bitmap';
import { buildFittedLabelFields, createLabelQrValue } from './labelContent';
import { pointsToDots, resolveLabelTemplate } from './labelLayout';
import { findNearestLabelTemplate } from './labelTemplates';
import { fitQrModules, type QrGeometry } from './qrGeometry';

export interface RasterLabelRequest {
  label: PrintableLabel;
  settings: AppSettings;
  formOption?: LabelOption;
  storageOption?: LabelOption;
}

type RenderLabel = (request: RasterLabelRequest) => Promise<MonochromeBitmap>;

let activeRenderer: RenderLabel | null = null;

/** Converts the same React Native template used by the preview to an exact-sized PNG, then to 1-bit. */
export function renderLabelToBitmap(request: RasterLabelRequest): Promise<MonochromeBitmap> {
  if (!activeRenderer) return Promise.reject(new Error('PRINTER_RENDERER_UNAVAILABLE'));
  return activeRenderer(request);
}

interface PendingRender {
  request: RasterLabelRequest;
  width: number;
  height: number;
  resolve: (bitmap: MonochromeBitmap) => void;
  reject: (error: Error) => void;
}

export function LabelRasterizerHost() {
  const viewShot = useRef<ViewShotRef>(null);
  const [pending, setPending] = useState<PendingRender | null>(null);

  useEffect(() => {
    activeRenderer = (request) => new Promise<MonochromeBitmap>((resolve, reject) => {
      if (pending) {
        reject(new Error('PRINTER_RENDERER_BUSY'));
        return;
      }
      const template = findNearestLabelTemplate(request.label.labelWidthMm, request.label.labelHeightMm);
      const layout = resolveLabelTemplate(template, request.settings.printerProfile.dpi);
      setPending({ request, width: layout.width, height: layout.height, resolve, reject });
    });
    return () => {
      activeRenderer = null;
    };
  }, [pending]);

  useEffect(() => {
    if (!pending || !viewShot.current) return;
    let cancelled = false;
    const frame = requestAnimationFrame(() => {
      void captureRef(viewShot, {
        format: 'png',
        result: 'base64',
        width: pending.width,
        height: pending.height,
      })
        .then((base64) => {
          if (!cancelled) {
            const png = UPNG.decode(toByteArray(base64).buffer as ArrayBuffer);
            if (png.width !== pending.width || png.height !== pending.height) {
              throw new Error('PRINTER_RENDER_SIZE_MISMATCH');
            }
            const rgba = new Uint8Array(UPNG.toRGBA8(png)[0]!);
            pending.resolve(
              thresholdRgbaToBitmap(
                rgba,
                png.width,
                png.height,
                pending.request.settings.printerThresholdPercent,
              ),
            );
          }
        })
        .catch((error: unknown) => {
          if (!cancelled) pending.reject(error instanceof Error ? error : new Error('PRINTER_RENDER_FAILED'));
        })
        .finally(() => {
          if (!cancelled) setPending(null);
        });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [pending]);

  return (
    <ViewShotCapture ref={viewShot}>
      {pending ? <RasterLabel request={pending.request} /> : <View style={styles.placeholder} />}
    </ViewShotCapture>
  );
}

function ViewShotCapture({ children, ref }: { children: React.ReactNode; ref: React.RefObject<ViewShotRef | null> }) {
  // A native ViewShot needs a mounted, laid-out view. It is intentionally offscreen but never transparent.
  return (
    <View style={styles.offscreen} collapsable={false} ref={ref}>
      {children}
    </View>
  );
}

function RasterLabel({ request }: { request: RasterLabelRequest }) {
  const template = findNearestLabelTemplate(request.label.labelWidthMm, request.label.labelHeightMm);
  const layout = resolveLabelTemplate(template, request.settings.printerProfile.dpi);
  const values = new Map(
    buildFittedLabelFields({
      template,
      label: request.label,
      settings: request.settings,
      language: request.settings.language,
      formOption: request.formOption,
      storageOption: request.storageOption,
    }).map((field) => [field.id, field]),
  );
  const qr = createQrGeometry(createLabelQrValue(request.label), layout.qr.width, layout.qr.quietMargin);

  return (
    <Svg width={layout.width} height={layout.height} viewBox={`0 0 ${layout.width} ${layout.height}`}>
      <Rect width={layout.width} height={layout.height} fill={colors.monochromeSurface} />
      {layout.textZones.flatMap((zone) => {
        const value = values.get(zone.id);
        if (!value?.lines.length) return [];
        const fontSize = pointsToDots(value.fontSizePt, layout.dpi);
        const lineHeight = fontSize * 1.16;
        const firstBaseline = zone.y + (zone.height - value.lines.length * lineHeight) / 2 + fontSize;
        const anchor = zone.align === 'left' ? 'start' : zone.align === 'center' ? 'middle' : 'end';
        const x = zone.align === 'left' ? zone.x : zone.align === 'center' ? zone.x + zone.width / 2 : zone.x + zone.width;
        const family = zone.id === 'itemName' ? fonts.bold : zone.id === 'useByValue' ? fonts.extraBold : fonts.medium;
        return value.lines.map((line, index) => (
          <SvgText
            key={`${zone.id}-${index}`}
            fill={colors.monochromeBlack}
            fontFamily={family}
            fontSize={fontSize}
            textAnchor={anchor}
            x={x}
            y={firstBaseline + index * lineHeight}
          >
            {line}
          </SvgText>
        ));
      })}
      {qr.matrix.flatMap((row, rowIndex) => row.flatMap((black, columnIndex) => {
        if (!black) return [];
        return (
          <Rect
            key={`${rowIndex}-${columnIndex}`}
            fill={colors.monochromeBlack}
            height={qr.geometry.moduleSize}
            width={qr.geometry.moduleSize}
            x={layout.qr.x + qr.geometry.offset + qr.geometry.quietZone + columnIndex * qr.geometry.moduleSize}
            y={layout.qr.y + qr.geometry.offset + qr.geometry.quietZone + rowIndex * qr.geometry.moduleSize}
          />
        );
      }))}
    </Svg>
  );
}

function createQrGeometry(value: string, zoneSize: number, requestedQuietZone: number): {
  matrix: boolean[][];
  geometry: QrGeometry;
} {
  const generated = QRCode.create(value, { errorCorrectionLevel: 'M' });
  const moduleCount = generated.modules.size;
  const matrix = Array.from({ length: moduleCount }, (_, row) =>
    Array.from({ length: moduleCount }, (_, column) => generated.modules.get(row, column) === 1),
  );
  return { matrix, geometry: fitQrModules(moduleCount, zoneSize, requestedQuietZone) };
}

const styles = StyleSheet.create({
  offscreen: { position: 'absolute', left: -10000, top: -10000 },
  placeholder: { width: 1, height: 1 },
});
