import React, { createContext, useContext, useEffect, useState } from 'react';
import { open, QuickSQLiteConnection } from 'react-native-quick-sqlite';
import RNFS from 'react-native-fs';

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
  grade_name: string | null;
};

type DatabaseContextType = {
  db: QuickSQLiteConnection | null;
  ready: boolean;
  error: string | null;
  getFilteredClimbs: (angle: number) => Promise<DbClimb[]>;
  getClimb: (uuid: string) => Promise<DbClimb | null>;
};

const DatabaseContext = createContext<DatabaseContextType | undefined>(
  undefined,
);

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<QuickSQLiteConnection | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeDatabase();
  }, []);

  const initializeDatabase = async () => {
    try {
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

      const connection = open({ name: dbName });
      setDb(connection);
      setReady(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown database error');
    }
  };

  const getFilteredClimbs = async (angle: number): Promise<DbClimb[]> => {
    if (!db) {
      console.warn('Attempting to query with no database connection.');
      return [];
    }

    let climbs: DbClimb[] = [];

    let { rows } = await db.executeAsync(
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
        climb_stats.fa_at,
        difficulty_grades.boulder_name AS grade_name
      FROM climbs
      LEFT JOIN climb_cache_fields ON climbs.uuid = climb_cache_fields.climb_uuid
      LEFT JOIN climb_stats ON climbs.uuid = climb_stats.climb_uuid AND climb_stats.angle = ?
      LEFT JOIN difficulty_grades ON ROUND(climb_stats.display_difficulty) = difficulty_grades.difficulty
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
  };

  const getClimb = async (uuid: string): Promise<DbClimb | null> => {
    if (!db) {
      console.warn('Attempting to query with no database connection.');
      return null;
    }

    let { rows } = await db.executeAsync(
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
        climb_stats.fa_at,
        difficulty_grades.boulder_name AS grade_name
      FROM climbs
      LEFT JOIN climb_cache_fields ON climbs.uuid = climb_cache_fields.climb_uuid
      LEFT JOIN climb_stats ON climbs.uuid = climb_stats.climb_uuid
      LEFT JOIN difficulty_grades ON ROUND(climb_cache_fields.display_difficulty) = difficulty_grades.difficulty
      WHERE climbs.uuid = ?
      `,
      [uuid],
    );

    if (rows && rows.length > 0) {
      return rows.item(0);
    }

    return null;
  };

  return (
    <DatabaseContext.Provider
      value={{
        db,
        ready,
        error,
        getFilteredClimbs,
        getClimb,
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase() {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
}
