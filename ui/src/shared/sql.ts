import { Database } from "sql.js";

export namespace genenames {
  export interface GenenameEntry {
    symbol: string;
    hgncId: string;
    name: string;
  }

  export function searchByPrefix(
    db: Database,
    prefix: string,
    limit: number = 10
  ): GenenameEntry[] {
    const stmt = db.prepare(`
      SELECT distinct
          symbol
          ,hgnc_id as hgncId
          ,name
      FROM genenames
      WHERE symbol LIKE :prefix || '%'
      ORDER BY name
      LIMIT :limit
      `);
    const p = { ":prefix": prefix, ":limit": limit };
    stmt.bind(p);
    const r: GenenameEntry[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      r.push(row as unknown as GenenameEntry);
    }
    return r;
  }

  export function searchByHgncId(
    db: Database,
    hgncId: string
  ): GenenameEntry[] {
    const stmt = db.prepare(`
      SELECT distinct
          symbol
          ,hgnc_id as hgncId
          ,name
      FROM genenames
      WHERE hgnc_id = :hgncId
      ORDER BY name
      `);
    const p = { ":hgncId": hgncId };
    stmt.bind(p);
    const r: GenenameEntry[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      r.push(row as unknown as GenenameEntry);
    }
    return r;
  }
}

/*----------------------------------------------------------------------------*/

export namespace version {
  export interface VersionEntry {
    sha1: string;
    date: Date;
    label: string;
  }
  export function getVersion(db: Database): VersionEntry {
    const stmt = db.prepare(`
    SELECT
        sha1
        ,date
        ,label
    FROM version
    `);
    stmt.step();
    const row = stmt.getAsObject();
    return {
      sha1: row["sha1"] as string,
      date: new Date(row["date"] as string),
      label: row["label"] as string,
    };
  }
}

/*----------------------------------------------------------------------------*/

export namespace genepanels {
  export interface GenepanelEntry {
    id: string;
    genepanelName: string;
    genepanelVersion: string;
    transcript: string;
    transcriptSource: string;
    inheritance: string;
  }

  export function searchLatestById(db: Database, id: string): GenepanelEntry[] {
    const stmt = db.prepare(`
    WITH latest_genepanels AS (
      SELECT
        genepanel_name,
        MAX(genepanel_version) AS genepanel_version
        FROM genepanels l
      WHERE
        l.id = :id
      GROUP BY
        genepanel_name
      )
      SELECT
        id
        ,genepanel_name AS genepanelName
        ,genepanel_version AS genepanelVersion
        ,transcript
        ,transcript_source AS transcriptSource
        ,inheritance
        FROM genepanels g
      WHERE
        g.id = :id
        AND (g.genepanel_name,
        g.genepanel_version) IN (
        SELECT
          l.genepanel_name,
          l.genepanel_version
        FROM
          latest_genepanels l)
      `);
    const p = { ":id": id };
    stmt.bind(p);
    const r: GenepanelEntry[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      r.push(row as unknown as GenepanelEntry);
    }
    return r;
  }

  export interface Gene {
    id: string;
    symbol: string;
  }

  export function searchGenesByNameVersion(
    db: Database,
    name: string,
    version: string
  ): Gene[] | undefined {
    const stmt = db.prepare(`
      SELECT
        g.id,
        g2.symbol
      FROM
        genepanels g
      LEFT OUTER JOIN genenames g2 ON
        g.id = g2.hgnc_id
      WHERE
        g.genepanel_name = :name
        AND genepanel_version = :version
      ORDER BY g2.symbol
      `);
    const p = { ":name": name, ":version": version };
    stmt.bind(p);
    const r: Gene[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      r.push(row as unknown as Gene);
    }
    return r;
  }
}
