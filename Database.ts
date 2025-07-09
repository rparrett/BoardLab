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

  let { rows } = db.execute('SELECT * FROM climbs WHERE angle = ? LIMIT 10', [
    angle,
  ]);
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
};

// export const getClimbs = (): DbClimb[] => {
//   let { rows } = db.execute(
//     `SELECT
//         uuid, name, description, frames_count, frames_pace, frames, setter_id,
//         setter_username, layout_id, is_draft, is_listed, angle
//     FROM climbs`,
//   );

//   rows.forEach(row => {
//     console.log(row);
//   });

//   return [];
// };

// export const getDBConnection = async () => {
//   return openDatabase({
//     name: 'test.db',
//     location: 'default',
//     // readOnly: true,
//     // createFromLocation: 'assets/db.sqlite3',
//   });
// };

// export const getClimbs = async (db: SQLiteDatabase): Promise<DbClimb[]> => {
//   const climbs: DbClimb[] = [];
//   const results = await db.executeSql(
//     `SELECT
//         uuid, name, description, frames_count, frames_pace, frames, setter_id,
//         setter_username, layout_id, is_draft, is_listed, angle
//     FROM climbs`,
//   );
//   results.forEach(result => {
//     for (let index = 0; index < result.rows.length; index++) {
//       console.log(result.rows.item(index));
//       climbs.push(result.rows.item(index));
//     }
//   });
//   return climbs;
// };
