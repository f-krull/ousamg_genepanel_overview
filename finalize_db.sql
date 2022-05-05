-- prune refseq

WITH ids AS (
    SELECT
      DISTINCT r.refseq_id
    FROM
      genepanel_regions r
    WHERE
      r.refseq_id NOT NULL
    )
    DELETE
    FROM
      refseq
    WHERE
      id NOT IN (
      SELECT
        refseq_id
      FROM
        ids);

-- prune hgnc

WITH ids AS (
    SELECT
      DISTINCT r.hgnc_id
    FROM
      refseq r
    WHERE
      r.hgnc_id NOT NULL
    )
    DELETE
    FROM
      genenames
    WHERE
      hgnc_id NOT IN (
      SELECT
        hgnc_id
      FROM
        ids);

VACUUM;
