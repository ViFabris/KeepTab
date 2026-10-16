export interface QrGeometry {
  moduleSize: number;
  quietZone: number;
  contentSize: number;
  offset: number;
}

/** Fits a QR matrix with a four-module quiet zone and only integer-dot modules. */
export function fitQrModules(
  moduleCount: number,
  zoneSizeDots: number,
  requestedQuietZoneDots: number,
): QrGeometry {
  if (!Number.isInteger(moduleCount) || moduleCount < 1 || !Number.isInteger(zoneSizeDots)) {
    throw new Error('QR_GEOMETRY_INVALID');
  }
  for (let moduleSize = Math.floor(zoneSizeDots / (moduleCount + 8)); moduleSize >= 3; moduleSize -= 1) {
    const quietZone = Math.max(requestedQuietZoneDots, moduleSize * 4);
    const contentSize = moduleCount * moduleSize;
    const used = contentSize + quietZone * 2;
    if (used <= zoneSizeDots) return { moduleSize, quietZone, contentSize, offset: Math.floor((zoneSizeDots - used) / 2) };
  }
  throw new Error('QR_DOES_NOT_FIT');
}
