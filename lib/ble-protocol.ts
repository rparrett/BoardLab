/* eslint-disable no-bitwise */

export enum ApiLevel {
  Two = 2,
  Three = 3,
}

export function calculateChecksum(data: Uint8Array): number {
  let i = 0;
  for (const byte of data) {
    i = (i + byte) & 255;
  }
  return ~i & 255;
}

export function encodeRgb222(r: number, g: number, b: number): number {
  const rCompressed = (r >> 6) & 0x03;
  const gCompressed = (g >> 6) & 0x03;
  const bCompressed = (b >> 6) & 0x03;
  return (rCompressed << 4) | (gCompressed << 2) | bCompressed;
}

export function encodeRgb332(r: number, g: number, b: number): number {
  const rCompressed = (r >> 5) & 0x07;
  const gCompressed = (g >> 5) & 0x07;
  const bCompressed = (b >> 6) & 0x03;
  return (rCompressed << 5) | (gCompressed << 2) | bCompressed;
}

export function hexToRgb(hex: string): [number, number, number] {
  if (hex.length !== 6) {
    throw new Error('Hex string must be 6 characters long');
  }

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    throw new Error('Invalid hex color');
  }

  return [r, g, b];
}

export function encodeHoldsData(
  holds: Array<[number, [number, number, number]]>,
  apiLevel: ApiLevel,
): Uint8Array {
  const packetData: number[] = [];

  const packetMarker = apiLevel === ApiLevel.Two ? 80 : 84; // 'P' or 'T'
  packetData.push(packetMarker);

  for (const [position, [r, g, b]] of holds) {
    switch (apiLevel) {
      case ApiLevel.Two: {
        // First byte: lowest 8 bits of position
        const byte1 = position & 0xff;

        // Second byte: highest 2 bits of position + 6 bits of RGB (2-2-2)
        const rgbEncoded = encodeRgb222(r, g, b);
        const byte2 = ((position >> 8) & 0x03) | (rgbEncoded << 2);

        packetData.push(byte1);
        packetData.push(byte2);
        break;
      }
      case ApiLevel.Three: {
        // First byte: lowest 8 bits of position
        const byte1 = position & 0xff;

        // Second byte: highest 8 bits of position
        const byte2 = (position >> 8) & 0xff;

        // Third byte: RGB color (3-3-2)
        const byte3 = encodeRgb332(r, g, b);

        packetData.push(byte1);
        packetData.push(byte2);
        packetData.push(byte3);
        break;
      }
    }
  }

  const packetDataArray = new Uint8Array(packetData);
  const packet = new Uint8Array(packetData.length + 5);

  // Packet structure: [1, length, checksum, 2, ...data, 3]
  packet[0] = 1;
  packet[1] = packetDataArray.length;
  packet[2] = calculateChecksum(packetDataArray);
  packet[3] = 2;
  packet.set(packetDataArray, 4);
  packet[packet.length - 1] = 3;

  // Log the packet for debugging
  const hexString = Array.from(packet)
    .map(b => b.toString(16).padStart(2, '0').toUpperCase())
    .join(' ');
  console.log(
    `BLE: Encoded packet ApiLevel.${ApiLevel[apiLevel]} (${packet.length} bytes): ${hexString}`,
  );

  return packet;
}

export function convertFramesToBleData(
  climbPlacements: Map<number, number>,
  placementData: Map<number, { position: number }>,
  roles: Map<number, { ledColor: string }>,
): Array<[number, [number, number, number]]> {
  const bleData: Array<[number, [number, number, number]]> = [];

  for (const [placementId, placementRoleId] of climbPlacements) {
    const placement = placementData.get(placementId);
    if (!placement) {
      console.error(`Placement lookup failed: ${placementId}`);
      continue;
    }

    const role = roles.get(placementRoleId);
    if (!role) {
      console.error(`Role lookup failed: ${placementRoleId}`);
      continue;
    }

    try {
      const [r, g, b] = hexToRgb(role.ledColor);
      bleData.push([placement.position, [r, g, b]]);
    } catch (error) {
      console.error(
        `Error converting color for role ${placementRoleId}: ${error}`,
      );
    }
  }

  return bleData;
}
