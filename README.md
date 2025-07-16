# Board lab

## Install Icons

`npx rnvi-update-plist package.json ios/BoardLab/Info.plist`

# Notes

## Find setter user ids for "discovery mode"

```sql
SELECT
      c.setter_id,
      c.setter_username,
      AVG(ccf.quality_average) as avg_quality,
      SUM(ccf.ascensionist_count) as total_ascensionist_count,
      COUNT(c.uuid) as climb_count
  FROM climbs c
  LEFT JOIN climb_cache_fields ccf ON c.uuid = ccf.climb_uuid
  WHERE c.is_listed = 1
      AND ccf.quality_average IS NOT NULL
      AND ccf.ascensionist_count > 20
      AND c.angle BETWEEN 20 AND 30
  GROUP BY c.setter_id, c.setter_username
  HAVING COUNT(c.uuid) > 5
  ORDER BY avg_quality DESC
  LIMIT 100;
```
