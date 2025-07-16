import React, { createContext, useContext, useEffect, useState } from 'react';
import { open, QuickSQLiteConnection } from 'react-native-quick-sqlite';
import RNFS from 'react-native-fs';
import { IndexedMap } from '../lib/IndexedMap';

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

export type PlacementData = {
  placementId: number;
  x: number;
  y: number;
  position: number;
};

export type Role = {
  id: number;
  productId: number;
  position: number;
  name: string;
  fullName: string;
  ledColor: string;
  screenColor: string;
};

export type GradeOption = {
  difficulty: number;
  name: string;
};

export type ClimbFilters = {
  angle: number;
  search: string;
  grades: number[]; // Array of selected difficulty values, empty array means no filter
  setAtCurrentAngle: boolean; // Filter for climbs set at current angle ±5 degrees
};

type DatabaseContextType = {
  db: QuickSQLiteConnection | null;
  ready: boolean;
  error: string | null;
  getFilteredClimbs: (
    filters: ClimbFilters,
  ) => Promise<IndexedMap<string, DbClimb>>;
  getClimb: (uuid: string, angle?: number) => Promise<DbClimb | null>;
  getPlacementData: () => Promise<Map<number, PlacementData>>;
  getRoles: (productId: number) => Promise<Map<number, Role>>;
  getAvailableGrades: () => Promise<GradeOption[]>;
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

  const getFilteredClimbs = async (
    filters: ClimbFilters,
  ): Promise<IndexedMap<string, DbClimb>> => {
    if (!db) {
      console.warn('Attempting to query with no database connection.');
      return new IndexedMap<string, DbClimb>([], climb => climb.uuid);
    }

    console.log('getFilteredClimbs');

    const climbs: DbClimb[] = [];

    // Build the WHERE clause dynamically based on filters
    let whereClause = 'WHERE climbs.layout_id = 1 AND climbs.name LIKE ?';
    let params: any[] = [filters.angle, `%${filters.search}%`];

    // Add grade filter if provided
    if (filters.grades && filters.grades.length > 0) {
      const gradeParams = filters.grades.map(() => '?').join(', ');
      whereClause += ` AND difficulty_grades.difficulty IN (${gradeParams})`;
      params.push(...filters.grades);
    }

    // Add setter angle filter if enabled
    if (filters.setAtCurrentAngle) {
      whereClause += ` AND climbs.angle BETWEEN ? AND ?`;
      params.push(filters.angle - 5, filters.angle + 5);
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
      LEFT JOIN climb_stats ON climbs.uuid = climb_stats.climb_uuid AND climb_stats.angle = ?
      LEFT JOIN difficulty_grades ON ROUND(climb_stats.display_difficulty) = difficulty_grades.difficulty
      ${whereClause}
      ORDER BY climb_stats.ascensionist_count DESC
      LIMIT 100
      `,
      params,
    );

    if (rows) {
      for (let i = 0; i < rows.length; i++) {
        const climb = rows.item(i);
        climbs.push(climb);
      }
    }

    return new IndexedMap(climbs, climb => climb.uuid);
  };

  const getClimb = async (
    uuid: string,
    angle?: number,
  ): Promise<DbClimb | null> => {
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
      LEFT JOIN climb_stats ON climbs.uuid = climb_stats.climb_uuid AND climb_stats.angle = ?
      LEFT JOIN difficulty_grades ON ROUND(climb_stats.display_difficulty) = difficulty_grades.difficulty
      WHERE climbs.uuid = ?
      `,
      [angle || 40, uuid],
    );

    if (rows && rows.length > 0) {
      return rows.item(0);
    }

    return null;
  };

  const getPlacementData = async (): Promise<Map<number, PlacementData>> => {
    if (!db) {
      console.warn('Attempting to query with no database connection.');
      return new Map();
    }

    let { rows } = await db.executeAsync(
      `
      SELECT
        placements.id as placement_id,
        CAST(holes.x - edge_left AS FLOAT) / CAST(edge_right - edge_left AS FLOAT) AS x,
        CAST(holes.y - edge_top AS FLOAT) / CAST(edge_bottom - edge_top AS FLOAT) AS y,
        leds.position
      FROM placements
      JOIN holes ON placements.hole_id = holes.id
      JOIN leds ON holes.id = leds.hole_id AND leds.product_size_id = 10
      JOIN product_sizes ON product_sizes.id = leds.product_size_id
      WHERE placements.layout_id = 1
      `,
      [],
    );

    const placementMap = new Map<number, PlacementData>();

    if (rows) {
      for (let i = 0; i < rows.length; i++) {
        const row = rows.item(i);

        // Map by the LED position, which corresponds to the position used in frames
        placementMap.set(row.placement_id, {
          placementId: row.placement_id,
          x: row.x,
          y: row.y,
          position: row.position,
        });
      }
    }

    return placementMap;
  };

  const getRoles = async (productId: number): Promise<Map<number, Role>> => {
    if (!db) {
      console.warn('Attempting to query with no database connection.');
      return new Map();
    }

    let { rows } = await db.executeAsync(
      `
      SELECT
        id,
        product_id,
        position,
        name,
        full_name,
        led_color,
        screen_color
      FROM placement_roles
      WHERE product_id = ?
      `,
      [productId],
    );

    const rolesMap = new Map<number, Role>();

    if (rows) {
      for (let i = 0; i < rows.length; i++) {
        const row = rows.item(i);
        rolesMap.set(row.id, {
          id: row.id,
          productId: row.product_id,
          position: row.position,
          name: row.name,
          fullName: row.full_name,
          ledColor: row.led_color,
          screenColor: row.screen_color,
        });
      }
    }

    // Add mock special roles for testing
    const mockSpecialRoles: Role[] = [
      {
        id: 99,
        productId: productId,
        position: 99,
        name: 'Matching',
        fullName: 'Matching Allowed',
        ledColor: 'FFFFFF',
        screenColor: '000000',
      },
      {
        id: 98,
        productId: productId,
        position: 98,
        name: 'Easy Mode',
        fullName: 'Easy Mode',
        ledColor: 'FF0000',
        screenColor: 'FF0000',
      },
      {
        id: 97,
        productId: productId,
        position: 97,
        name: 'Purple',
        fullName: 'Purple',
        ledColor: '9370DB',
        screenColor: '9370DB',
      },
      {
        id: 96,
        productId: productId,
        position: 96,
        name: 'Blue',
        fullName: 'Blue',
        ledColor: '3B82F6',
        screenColor: '3B82F6',
      },
    ];

    // Add special roles to the map
    mockSpecialRoles.forEach(role => {
      rolesMap.set(role.id, role);
    });

    return rolesMap;
  };

  const getAvailableGrades = async (): Promise<GradeOption[]> => {
    if (!db) {
      console.warn('Attempting to query with no database connection.');
      return [];
    }

    let { rows } = await db.executeAsync(
      `
      SELECT difficulty, boulder_name
      FROM difficulty_grades
      WHERE boulder_name IS NOT NULL AND is_listed = 1
      ORDER BY difficulty ASC
      `,
      [],
    );

    const grades: GradeOption[] = [];
    if (rows) {
      for (let i = 0; i < rows.length; i++) {
        const row = rows.item(i);
        grades.push({
          difficulty: row.difficulty,
          name: row.boulder_name,
        });
      }
    }

    return grades;
  };

  return (
    <DatabaseContext.Provider
      value={{
        db,
        ready,
        error,
        getFilteredClimbs,
        getClimb,
        getPlacementData,
        getRoles: getRoles,
        getAvailableGrades,
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
