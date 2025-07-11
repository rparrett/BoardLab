/**
 * Utilities for geometric calculations
 */

export interface Point {
  x: number;
  y: number;
}

export interface Rectangle {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface Circle {
  centerX: number;
  centerY: number;
  radius: number;
}

export interface CircleRectIntersection {
  startAngle: number;
  totalArc: number;
}

/**
 * Calculate the largest usable arc of a circle that fits within a rectangle
 * @param circle - The circle to test
 * @param bounds - The rectangle bounds
 * @param buffer - Additional buffer space around the circle
 * @returns The largest continuous arc that stays within bounds
 */
export function calculateCircleRectIntersection(
  circle: Circle,
  bounds: Rectangle,
  buffer: number = 0,
): CircleRectIntersection {
  const { centerX: cx, centerY: cy, radius: r } = circle;
  const effectiveBounds = {
    left: bounds.left + buffer,
    right: bounds.right - buffer,
    top: bounds.top + buffer,
    bottom: bounds.bottom - buffer,
  };

  // Find all intersection points with rectangle boundaries
  const intersections: Array<{ angle: number; type: string }> = [];

  // Left edge: x = bounds.left
  if (cx - r < effectiveBounds.left && cx + r > effectiveBounds.left) {
    const dx = effectiveBounds.left - cx;
    if (Math.abs(dx) <= r) {
      const dy = Math.sqrt(r * r - dx * dx);
      intersections.push({
        angle: (Math.atan2(-dy, dx) * 180) / Math.PI,
        type: 'left',
      });
      intersections.push({
        angle: (Math.atan2(dy, dx) * 180) / Math.PI,
        type: 'left',
      });
    }
  }

  // Right edge: x = bounds.right
  if (cx - r < effectiveBounds.right && cx + r > effectiveBounds.right) {
    const dx = effectiveBounds.right - cx;
    if (Math.abs(dx) <= r) {
      const dy = Math.sqrt(r * r - dx * dx);
      intersections.push({
        angle: (Math.atan2(-dy, dx) * 180) / Math.PI,
        type: 'right',
      });
      intersections.push({
        angle: (Math.atan2(dy, dx) * 180) / Math.PI,
        type: 'right',
      });
    }
  }

  // Top edge: y = bounds.top
  if (cy - r < effectiveBounds.top && cy + r > effectiveBounds.top) {
    const dy = effectiveBounds.top - cy;
    if (Math.abs(dy) <= r) {
      const dx = Math.sqrt(r * r - dy * dy);
      intersections.push({
        angle: (Math.atan2(dy, -dx) * 180) / Math.PI,
        type: 'top',
      });
      intersections.push({
        angle: (Math.atan2(dy, dx) * 180) / Math.PI,
        type: 'top',
      });
    }
  }

  // Bottom edge: y = bounds.bottom
  if (cy - r < effectiveBounds.bottom && cy + r > effectiveBounds.bottom) {
    const dy = effectiveBounds.bottom - cy;
    if (Math.abs(dy) <= r) {
      const dx = Math.sqrt(r * r - dy * dy);
      intersections.push({
        angle: (Math.atan2(dy, -dx) * 180) / Math.PI,
        type: 'bottom',
      });
      intersections.push({
        angle: (Math.atan2(dy, dx) * 180) / Math.PI,
        type: 'bottom',
      });
    }
  }

  // If no intersections, entire circle is usable
  if (intersections.length === 0) {
    return { startAngle: 0, totalArc: 360 };
  }

  // Sort angles and find the largest continuous arc that's INSIDE the rectangle
  const angles = intersections.map(i => i.angle).sort((a, b) => a - b);

  let maxArc = 0;
  let bestStartAngle = 0;

  // Test each gap between intersection points
  for (let i = 0; i < angles.length; i++) {
    const gapStartAngle = angles[i];
    const gapEndAngle = angles[(i + 1) % angles.length];

    // Calculate the arc span for this gap
    let arcSpan;
    if (gapEndAngle > gapStartAngle) {
      arcSpan = gapEndAngle - gapStartAngle;
    } else {
      arcSpan = 360 - gapStartAngle + gapEndAngle;
    }

    // Test if the middle of this arc is inside the rectangle bounds
    const midAngle = gapStartAngle + arcSpan / 2;
    const testX = cx + Math.cos((midAngle * Math.PI) / 180) * r;
    const testY = cy + Math.sin((midAngle * Math.PI) / 180) * r;

    const isInsideBounds =
      testX >= effectiveBounds.left &&
      testX <= effectiveBounds.right &&
      testY >= effectiveBounds.top &&
      testY <= effectiveBounds.bottom;

    if (isInsideBounds && arcSpan > maxArc) {
      maxArc = arcSpan;
      bestStartAngle = gapStartAngle;
    }
  }

  return { startAngle: bestStartAngle, totalArc: maxArc };
}

/**
 * Calculate the minimum angle between two circles of given radius on a circle of given radius
 * @param itemRadius - Radius of the items to be placed
 * @param menuRadius - Radius of the circle they're placed on
 * @param spacing - Additional spacing between items
 * @returns Minimum angle in degrees
 */
export function calculateMinimumAngleBetweenCircles(
  itemRadius: number,
  menuRadius: number,
  spacing: number = 0,
): number {
  const totalItemRadius = itemRadius + spacing;

  // Ensure we don't get invalid arcsin values
  const ratio = Math.min(totalItemRadius / menuRadius, 1);
  const minAngleRadians = 2 * Math.asin(ratio);
  return (minAngleRadians * 180) / Math.PI; // Convert to degrees
}
