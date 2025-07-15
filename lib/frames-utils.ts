/**
 * Represents a climb's placement configuration
 * Maps placement ID to placement role ID
 */
export type ClimbPlacements = Map<number, number>;

/**
 * Parses a frames string into a climb placements mapping
 * @param framesString - String like "p123r456p789r012"
 * @returns Map of placement ID to placement role ID
 */
export function parseFramesString(framesString: string): ClimbPlacements {
  const climbPlacements = new Map<number, number>();
  const regex = /p(\d+)r(\d+)/g;
  let match;

  while ((match = regex.exec(framesString)) !== null) {
    const placementId = parseInt(match[1], 10);
    const placementRoleId = parseInt(match[2], 10);
    climbPlacements.set(placementId, placementRoleId);
  }

  return climbPlacements;
}

/**
 * Converts a climb placements mapping back to a frames string
 * @param climbPlacements - Map of placement ID to placement role ID
 * @returns String like "p123r456p789r012"
 */
export function serializeFramesMap(climbPlacements: ClimbPlacements): string {
  const frames: string[] = [];

  // Sort by placement ID for consistent output
  const sortedEntries = Array.from(climbPlacements.entries()).sort(
    (a, b) => a[0] - b[0],
  );

  for (const [placementId, placementRoleId] of sortedEntries) {
    frames.push(`p${placementId}r${placementRoleId}`);
  }

  return frames.join('');
}
