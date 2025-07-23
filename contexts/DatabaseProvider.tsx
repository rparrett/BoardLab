import React, { createContext, useContext, useEffect, useState } from 'react';
import { open, QuickSQLiteConnection } from 'react-native-quick-sqlite';
import RNFS from 'react-native-fs';
import { IndexedMap } from '../lib/IndexedMap';
import { serializeFramesMap } from '../lib/frames-utils';
import { v4 as uuidv4 } from 'uuid';

// Values currently hardcoded for 12x12 Kilter Board w/ kickboard
export const LAYOUT_ID = 1;
export const PRODUCT_ID = 1;
const PRODUCT_SIZE_ID = 10;

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
  angle: number | null;
  created_at: string;
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

export type AngleStatsData = {
  display_difficulty: number;
  quality_average: number;
  ascensionist_count: number;
  fa_username: string;
  fa_at: string;
  grade_name: string | null;
};

export type ClimbFilters = {
  angle: number;
  search: string;
  grades: number[]; // Array of selected difficulty values, empty array means no filter
  setAtCurrentAngle: boolean; // Filter for climbs set at current angle ±5 degrees
  discoveryMode: boolean; // Filter for lesser known climbs by great setters
  setterUsername: string; // Filter by setter username
};

type DatabaseContextType = {
  db: QuickSQLiteConnection | null;
  ready: boolean;
  error: string | null;
  getFilteredClimbs: (
    filters: ClimbFilters,
  ) => Promise<IndexedMap<string, DbClimb>>;
  getClimb: (uuid: string, angle?: number) => Promise<DbClimb | null>;
  getClimbStatsForAllAngles: (
    uuid: string,
  ) => Promise<Map<number, AngleStatsData>>;
  getPlacementData: () => Promise<Map<number, PlacementData>>;
  getRoles: () => Promise<Map<number, Role>>;
  getAvailableGrades: () => Promise<GradeOption[]>;
  insertClimb: (climbData: {
    name: string;
    description: string;
    frames: Map<number, number>;
    angle: number;
    setterUsername?: string;
  }) => Promise<string>;
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

    // Get edge dimensions from product_sizes table
    const { rows: productSizeRows } = await db.executeAsync(
      'SELECT edge_left, edge_right, edge_bottom, edge_top FROM product_sizes WHERE id = ?',
      [PRODUCT_SIZE_ID],
    );

    if (!productSizeRows || productSizeRows.length === 0) {
      console.error('Could not find product size dimensions');
      return new IndexedMap<string, DbClimb>([], climb => climb.uuid);
    }

    const productSize = productSizeRows.item(0);
    const climbs: DbClimb[] = [];

    // Build the WHERE clause dynamically based on filters
    // Include climbs from boards that are subsets of our current board
    let whereClause =
      'WHERE climbs.layout_id = ? AND climbs.frames_count = 1 AND climbs.name LIKE ? AND climbs.edge_left >= ? AND climbs.edge_right <= ? AND climbs.edge_bottom >= ? AND climbs.edge_top <= ?';
    let params: any[] = [
      filters.angle,
      LAYOUT_ID,
      `%${filters.search}%`,
      productSize.edge_left,
      productSize.edge_right,
      productSize.edge_bottom,
      productSize.edge_top,
    ];

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

    // Add discovery mode filter if enabled
    if (filters.discoveryMode) {
      whereClause += ` AND climbs.setter_id IN (266750,69732,45298,1078,117913,12407,24718,19948,39718,9759,52481,39652,31690,147737,34977,4590,67409,152379,3303,86265,58371,7288,84574,131976,289037,28162,23507,47498,3085,74336,1446,81604,5333,123840,14677,50156,27006,1924,22158,103199,8967,37488,108354,77275,129013,11360,26283,174176,7956,57831,14884,7870,134862,11715,97911,12004,87125,88648,6865,4602,28200,26376,122991,22407,55773,349506,68586,57252,99443,5183,3843,33992,1623,29602,282065,72548,11255,35334,12744,36126,8880,79530,91804,79538,4553,129199,29964,149053,28912,36466,172959,1085,1353,75245,127627,166743,56411,42382,174173,186589,266750,69732,45298,1078,117913,12407,24718,19948,39718,9759,52481,39652,31690,147737,34977,4590,67409,152379,3303,86265,58371,7288,84574,131976,289037,28162,23507,47498,3085,74336,1446,81604,5333,123840,14677,50156,27006,1924,22158,103199,8967,37488,108354,77275,129013,11360,26283,174176,7956,57831,14884,7870,134862,11715,97911,12004,87125,88648,6865,4602,28200,26376,122991,22407,55773,349506,68586,57252,99443,5183,3843,33992,1623,29602,282065,72548,11255,35334,12744,36126,8880,79530,91804,79538,4553,129199,29964,149053,28912,36466,172959,1085,1353,75245,127627,166743,56411,42382,174173,186589,134862,185316,277285,128749,117962,468956) AND climb_cache_fields.ascensionist_count < 10`;
    }

    // Add setter username filter if provided
    if (filters.setterUsername && filters.setterUsername.trim() !== '') {
      whereClause += ` AND climbs.setter_username LIKE ?`;
      params.push(`%${filters.setterUsername.trim()}%`);
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
      LIMIT 1000
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
      JOIN leds ON holes.id = leds.hole_id AND leds.product_size_id = ?
      JOIN product_sizes ON product_sizes.id = leds.product_size_id
      WHERE placements.layout_id = ?
      `,
      [PRODUCT_SIZE_ID, LAYOUT_ID],
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

  const getRoles = async (): Promise<Map<number, Role>> => {
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
      [PRODUCT_ID],
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
        productId: PRODUCT_ID,
        position: 99,
        name: 'Matching',
        fullName: 'Matching Allowed',
        ledColor: 'FFFFFF',
        screenColor: '000000',
      },
      {
        id: 98,
        productId: PRODUCT_ID,
        position: 98,
        name: 'Easy Mode',
        fullName: 'Easy Mode',
        ledColor: 'FF0000',
        screenColor: 'FF0000',
      },
      {
        id: 97,
        productId: PRODUCT_ID,
        position: 97,
        name: 'Purple',
        fullName: 'Purple',
        ledColor: '9370DB',
        screenColor: '9370DB',
      },
      {
        id: 96,
        productId: PRODUCT_ID,
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

  const getClimbStatsForAllAngles = async (
    uuid: string,
  ): Promise<Map<number, AngleStatsData>> => {
    if (!db) {
      console.warn('Attempting to query with no database connection.');
      return new Map();
    }

    let { rows } = await db.executeAsync(
      `
      SELECT
        climb_stats.angle,
        climb_stats.display_difficulty,
        climb_stats.quality_average,
        climb_stats.ascensionist_count,
        climb_stats.fa_username,
        climb_stats.fa_at,
        difficulty_grades.boulder_name AS grade_name
      FROM climb_stats
      LEFT JOIN difficulty_grades ON ROUND(climb_stats.display_difficulty) = difficulty_grades.difficulty
      WHERE climb_stats.climb_uuid = ?
      `,
      [uuid],
    );

    const statsMap = new Map<number, AngleStatsData>();
    if (rows) {
      for (let i = 0; i < rows.length; i++) {
        const row = rows.item(i);
        statsMap.set(row.angle, {
          display_difficulty: row.display_difficulty,
          quality_average: row.quality_average,
          ascensionist_count: row.ascensionist_count,
          fa_username: row.fa_username,
          fa_at: row.fa_at,
          grade_name: row.grade_name,
        });
      }
    }

    return statsMap;
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

  const generateUuid = (): string => {
    return uuidv4().replace(/-/g, '');
  };

  const insertClimb = async (climbData: {
    name: string;
    description: string;
    frames: Map<number, number>;
    angle: number;
    setterUsername?: string;
  }): Promise<string> => {
    if (!db) {
      console.warn('Attempting to insert with no database connection.');
      throw new Error('No database connection');
    }

    const uuid = generateUuid();
    const framesString = serializeFramesMap(climbData.frames);
    const now = new Date().toISOString();

    const {
      name,
      description,
      angle,
      setterUsername = 'LocalUser',
    } = climbData;

    // Auto-detect if this is a "no match" climb based on description
    const isNoMatch = /no match/i.test(description);

    // Get edge dimensions from product_sizes table
    const { rows: productSizeRows } = await db.executeAsync(
      'SELECT edge_left, edge_right, edge_bottom, edge_top FROM product_sizes WHERE id = ?',
      [PRODUCT_SIZE_ID],
    );

    if (!productSizeRows || productSizeRows.length === 0) {
      throw new Error('Could not find product size dimensions');
    }

    const productSize = productSizeRows.item(0);

    await db.executeAsync(
      `INSERT INTO climbs (
        uuid,
        layout_id,
        setter_id,
        setter_username,
        name,
        description,
        hsm,
        edge_left,
        edge_right,
        edge_bottom,
        edge_top,
        angle,
        frames_count,
        frames_pace,
        frames,
        is_draft,
        is_listed,
        created_at,
        is_nomatch
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        uuid,
        LAYOUT_ID,
        1, // setter_id - default to 1 for now
        setterUsername,
        name,
        description,
        3, // hsm - `3` might be "Bolt ons" + "Screw Ons". See `sets` database.
        productSize.edge_left,
        productSize.edge_right,
        productSize.edge_bottom,
        productSize.edge_top,
        angle,
        1, // frames_count - not doing multi-frame routes yet
        0, // frames_pace - not doing multi-frame routes yet
        framesString,
        true, // is_draft - keep user-created climbs as drafts
        false, // is_listed - start as private
        now,
        isNoMatch,
      ],
    );

    return uuid;
  };

  return (
    <DatabaseContext.Provider
      value={{
        db,
        ready,
        error,
        getFilteredClimbs,
        getClimb,
        getClimbStatsForAllAngles,
        getPlacementData,
        getRoles: getRoles,
        getAvailableGrades,
        insertClimb,
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
