import { Database, ParamsObject } from "sql.js";

function nullToUndefined<T>(v: any | null): T | undefined {
  if (v === null) {
    return undefined;
  }
  return v as T;
}

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

  export function searchByGeneSymbol(
    db: Database,
    symbol: string
  ): GenenameEntry[] {
    const stmt = db.prepare(`
      SELECT distinct
          symbol
          ,hgnc_id as hgncId
          ,name
      FROM genenames
      WHERE symbol = :symbol
      ORDER BY name
      `);
    const p = { ":symbol": symbol };
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

export namespace geneinfo {
  export interface GeneInfoEntry extends genenames.GenenameEntry {
    coverageWes: number | undefined;
    coverageWgs: number | undefined;
    segdupWes: number | undefined;
    segdupWgs: number | undefined;
  }

  export function searchByHgncId(
    db: Database,
    hgncId: string
  ): GeneInfoEntry[] {
    const stmt = db.prepare(`
    select DISTINCT * from (
      SELECT distinct
        g.hgnc_id
        ,symbol
        ,name
        ,MAX(CASE WHEN c.type = "wgs" THEN coverage END) as coverage_wgs
        ,MAX(CASE WHEN c.type = "wes" THEN coverage END) as coverage_wes
      FROM genenames g
      LEFT OUTER JOIN gene_coverage c on g.hgnc_id = c.hgnc_id
      WHERE g.hgnc_id = :hgncId
      GROUP BY g.hgnc_id, symbol ,name
      ORDER BY symbol)
      `);
    const p = { ":hgncId": hgncId };
    stmt.bind(p);
    const r: GeneInfoEntry[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      r.push({
        hgncId: row.hgnc_id as string,
        symbol: row.symbol as string,
        name: row.name as string,
        coverageWes: nullToUndefined<number>(row.coverage_wes),
        coverageWgs: nullToUndefined<number>(row.coverage_wgs),
        segdupWes: nullToUndefined<number>(row.segdup_wgs),
        segdupWgs: nullToUndefined<number>(row.segdup_wes),
      });
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
  export interface GenepanelId {
    name: string;
    version: string;
  }

  export interface GenepanelEntry {
    genepanelName: string;
    genepanelVersion: string;
    refseqIds: string[];
    transcriptSource: string;
    inheritance: string;
    isLatest: boolean;
  }

  export function searchByHgncId(
    db: Database,
    hgnc_id: string
  ): GenepanelEntry[] {
    const stmt = db.prepare(`
      WITH refseq_ids AS (
        SELECT
          id
        FROM
          refseq r
        WHERE
          r.hgnc_id = :hgnc_id
      )
      SELECT
        genepanel_name
        ,genepanel_version
        ,GROUP_CONCAT(refseq_id) AS refseq_ids
        ,transcript_source
        ,GROUP_CONCAT(inh_mode) AS inh_mode
        ,CASE
          WHEN (genepanel_name, genepanel_version) in (select name, version from latest_genepanels)
            then 1
            else 0
          END AS is_latest
      FROM
        genepanel_regions g
      WHERE
        refseq_id IN (
          SELECT
            id
          FROM
            refseq_ids
        )
      GROUP BY genepanel_name, genepanel_version
      ORDER BY genepanel_name, genepanel_version
      `);
    const p = { ":hgnc_id": hgnc_id };
    stmt.bind(p);
    const r: GenepanelEntry[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      r.push({
        genepanelName: row.genepanel_name as string,
        genepanelVersion: row.genepanel_version as string,
        refseqIds: (row.refseq_ids as string).split(","),
        transcriptSource: row.transcript_source as string,
        inheritance: row.inh_mode as string,
        isLatest: (row.is_latest as number) ? true : false,
      });
    }
    return r;
  }

  export interface GenepanelGeneEntry {
    genepanelName: string;
    genepanelVersion: string;
    refseqId: string;
    transcriptSource: string;
    inheritance: string;
    hgncId: string;
    geneSymbol: string;
  }

  export function getGenepanelRegionsByNameVersion(
    db: Database,
    gpId: GenepanelId
  ): GenepanelGeneEntry[] {
    const stmt = db.prepare(`
      SELECT distinct
        g2.hgnc_id
        ,g2.symbol
        ,refseq_id
        ,transcript_source
        ,genepanel_name
        ,genepanel_version
        ,inh_mode
      FROM
        genepanel_regions g
      LEFT OUTER JOIN refseq r ON
        r.id = g.refseq_id
      LEFT OUTER JOIN genenames g2 ON
        r.hgnc_id = g2.hgnc_id
      WHERE
        g.genepanel_name = :name
        AND genepanel_version = :version
        AND g2.hgnc_id NOT NULL
      ORDER BY refseq_id, g2.hgnc_id, g2.symbol
      `);
    const p = { ":name": gpId.name, ":version": gpId.version };
    stmt.bind(p);
    const r: GenepanelGeneEntry[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      r.push({
        geneSymbol: row.symbol as string,
        genepanelName: row.genepanel_name as string,
        genepanelVersion: row.genepanel_version as string,
        hgncId: row.hgnc_id as string,
        inheritance: row.inh_mode as string,
        refseqId: row.refseq_id as string,
        transcriptSource: row.transcript_source as string,
      });
    }
    return r;
  }

  export interface Gene {
    hgncId: string;
    symbol: string;
  }

  export function searchGenesByNameVersion(
    db: Database,
    name: string,
    version: string
  ): Gene[] | undefined {
    const stmt = db.prepare(`
      SELECT distinct
        g2.hgnc_id,
        g2.symbol
      FROM
        genepanel_regions g
      LEFT OUTER JOIN refseq r ON
        r.id = g.refseq_id
      LEFT OUTER JOIN genenames g2 ON
        r.hgnc_id = g2.hgnc_id
      WHERE
        g.genepanel_name = :name
        AND genepanel_version = :version
        AND g2.hgnc_id NOT NULL
      ORDER BY g2.symbol
      `);
    const p = { ":name": name, ":version": version };
    stmt.bind(p);
    const r: Gene[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      r.push({
        hgncId: row.hgnc_id as string,
        symbol: row.symbol as string,
      });
    }
    return r;
  }

  interface GenepanelBase {
    name: string;
    version: string;
    dateCreated: Date | undefined;
    isLatest: boolean;
  }

  export interface Genepanel extends GenepanelBase {
    numRefseq: number;
  }

  export function getGenepanels(db: Database): Genepanel[] {
    const r: Genepanel[] = [];
    db.each(
      `
      WITH refseq_counts AS (
        SELECT
          genepanel_name AS name
          ,genepanel_version AS version
          ,count(refseq_id) AS num_refseq
        FROM genepanel_regions gr
        WHERE refseq_id IS NOT NULL
        GROUP BY gr.genepanel_name, gr.genepanel_version
      )
      SELECT
        p.name
        ,p.version
        ,p.date_created
        ,CASE
          WHEN (p.name, p.version) in (select name, version from latest_genepanels)
            then 1
            else 0
          END AS is_latest
        ,rc.num_refseq
      FROM genepanels p
      JOIN refseq_counts rc on rc.name = p.name AND rc.version = p.version
    `,
      (row: ParamsObject) =>
        r.push({
          isLatest: (row.is_latest as number) ? true : false,
          dateCreated:
            row.date_created !== null
              ? new Date(row.date_created as string)
              : undefined,
          name: row.name as string,
          version: row.version as string,
          numRefseq: row.num_refseq as number,
        }),
      () => {}
    );
    return r;
  }

  export interface GeneCount extends GenepanelBase {
    numHits: number;
  }

  export function getCountByHgncIds(
    db: Database,
    hgncIds: string[]
  ): GeneCount[] {
    // NOTE: SQLite does not seem to support variable lists.
    //         Creating a temp table seem to cause race
    //         conditions and requires write access to the DB.
    //       This is kind of a hack to feed the list of IDs.
    const dbStrHgncIds = hgncIds.map((e) => `'${e}'`).join(",");

    const r: GeneCount[] = [];
    db.each(
      `
      with tmp_refseq as (
        SELECT r.id, r.hgnc_id from refseq r where r.hgnc_id in (${dbStrHgncIds})
        )
        select genepanel_name, genepanel_version, count(hgnc_id) as numHits,
          case when (genepanel_name, genepanel_version) in (select name, version from latest_genepanels) then 1 else 0 end as isLatest,
          gp.date_created
        from (select DISTINCT gr.genepanel_name, gr.genepanel_version, tr.hgnc_id
          from genepanel_regions gr
          join tmp_refseq tr
          on tr.id = gr.refseq_id
        ) as gpr
        LEFT OUTER JOIN genepanels gp ON gp.name = gpr.genepanel_name AND gp.version = gpr.genepanel_version
          group by genepanel_name, genepanel_version
          order by genepanel_name, genepanel_version
        `,
      (row: ParamsObject) =>
        r.push({
          numHits: row.numHits as number,
          isLatest: (row.isLatest as number) ? true : false,
          dateCreated:
            row.date_created !== null
              ? new Date(row.date_created as string)
              : undefined,
          name: row.genepanel_name as string,
          version: row.genepanel_version as string,
        }),
      () => {}
    );
    return r;
  }
}
