import { open } from 'react-native-quick-sqlite';
import RNFS from 'react-native-fs';

export async function getClimbsDb(angle: number) {
  // Our "initial" database is included in the app in a location that is not
  // writable. So we'll move it to the users' documents directory.
  const dbName = 'db.sqlite3';
  const dbPath = `${RNFS.DocumentDirectoryPath}/${dbName}`;

  // Check if database already exists in documents
  const exists = await RNFS.exists(dbPath);

  if (!exists) {
    // Copy from assets to documents folder
    const assetPath = `${RNFS.MainBundlePath}/${dbName}`;
    await RNFS.copyFile(assetPath, dbPath);
  }

  const db = open({ name: dbName });

  let climbs: DbClimb[] = [];

  console.log(angle);

  let { rows } = db.execute(
    `
    SELECT
      climbs.*,
      climb_cache_fields.ascensionist_count AS total_ascensionist_count,
      climb_cache_fields.display_difficulty AS total_display_difficulty,
      climb_cache_fields.quality_average AS total_quality_average,
      climb_stats.display_difficulty,
      climb_stats.benchmark_difficulty,
      climb_stats.ascensionist_count,
      climb_stats.difficulty_average,
      climb_stats.quality_average,
      climb_stats.fa_username,
      climb_stats.fa_at
    FROM climbs
    LEFT JOIN climb_cache_fields ON climbs.uuid = climb_cache_fields.climb_uuid
    LEFT JOIN climb_stats ON climbs.uuid = climb_stats.climb_uuid AND climb_stats.angle = ?
    WHERE climbs.layout_id = 1
    ORDER BY climb_stats.ascensionist_count DESC
    LIMIT 100
    `,
    [angle],
  );
  if (rows) {
    for (let i = 0; i < rows.length; i++) {
      climbs.push(rows.item(i));
    }
  }

  return climbs;
}

export type DbClimb = {
  uuid: string;
  name: string;
  description: string;
  frames_count: number;
  frames_pace: number;
  frames: string;
  setter_id: number;
  setter_username: string;
  layout_id: number;
  is_draft: boolean;
  is_listed: boolean;
  angle: number;
  //
  total_ascensionist_count: number | null;
  total_display_difficulty: number | null;
  total_quality_average: number | null;
  //
  display_difficulty: number | null;
  benchmark_difficulty: number | null;
  ascensionist_count: number | null;
  difficulty_average: number | null;
  quality_average: number | null;
  fa_username: string | null;
  fa_at: string | null;
};
