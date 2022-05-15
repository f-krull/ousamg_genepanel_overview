-- prune refseq

WITH ids AS (
  SELECT DISTINCT r.refseq_id
  FROM genepanel_regions r
  WHERE r.refseq_id NOT NULL
)
DELETE FROM refseq
WHERE
  id NOT IN (
    SELECT refseq_id
    FROM ids
  );

-- prune gene coverage

WITH ids AS (
  SELECT DISTINCT r.hgnc_id
  FROM refseq r
  WHERE r.hgnc_id NOT NULL
)
DELETE FROM gene_coverage
 WHERE
   hgnc_id NOT IN (
     SELECT hgnc_id
     FROM ids
   );

-- prune hgnc

WITH ids AS (
  SELECT DISTINCT r.hgnc_id
  FROM refseq r
  WHERE r.hgnc_id NOT NULL
)
DELETE FROM genenames
WHERE
  hgnc_id NOT IN (
    SELECT hgnc_id
    FROM ids
  );

-- create views

CREATE VIEW latest_genepanels AS
  SELECT
    name,
    max(date_created) as date_created,  -- prefer high date over high version
    version
  FROM
    genepanels l
  WHERE
    -- use date if defined
    CASE WHEN l.date_created IS NOT NULL
      THEN
        l.date_created in (
          SELECT max(gp.date_created) FROM genepanels gp WHERE gp.name = l.name
        )
    ELSE
      -- use version otherwise
      l.version in (SELECT max(gp.version) FROM genepanels gp WHERE gp.name= l.name)
    END
  GROUP BY name;


-- shrink file

VACUUM;


-- create indexes

CREATE INDEX idx_genenames_symbol ON genenames(symbol);

CREATE INDEX idx_refseq_hgnc_id ON refseq(hgnc_id);

CREATE INDEX idx_genepanelregions_refseq_id ON genepanel_regions(refseq_id);

CREATE INDEX idx_genepanelregions_gpname_pversion ON genepanel_regions(genepanel_name, genepanel_version);

CREATE INDEX idx_gene_coverage_coverage ON gene_coverage(coverage);

CREATE INDEX idx_gene_coverage_type ON gene_coverage('type');

CREATE INDEX idx_gene_coverage_hgnc_id ON gene_coverage(hgnc_id);
