-- note: this script is split into queries are split
--       at semicolon char by reader

PRAGMA foreign_keys = ON;

CREATE TABLE version (
  sha1 TEXT
  ,'date' TEXT
  ,label TEXT
);

CREATE TABLE genepanel_regions (
  genepanel_name
  ,genepanel_version
  ,refseq_id text
  ,custom_id text
  ,inh_mode text
  ,transcript_source text
  ,PRIMARY KEY (refseq_id, custom_id, genepanel_name, genepanel_version)
  ,FOREIGN KEY (genepanel_name, genepanel_version) REFERENCES genepanels('name', 'version')
  ,FOREIGN KEY (refseq_id) REFERENCES refseq(id)
  ,FOREIGN KEY (custom_id, genepanel_name, genepanel_version) REFERENCES custom_regions(id, genepanel_name, genepanel_version)
);

CREATE TABLE custom_regions (
  id text NOT NULL
  ,'start' text NOT NULL
  ,'end' text  NOT NULL
  ,chr text NOT NULL
  ,'name' text
  ,genepanel_name text
  ,genepanel_version text
  ,PRIMARY KEY (id, genepanel_name, genepanel_version)
);

CREATE TABLE refseq (
  id text NOT NULL
  ,hgnc_id text
  ,PRIMARY KEY (id)
  ,FOREIGN KEY (hgnc_id) REFERENCES genenames(hgnc_id)
);

CREATE TABLE genepanels (
  'name' text
  ,'version' text
  ,date_created text
  ,PRIMARY KEY ('name', 'version')
);

CREATE TABLE genenames (
  hgnc_id text not null
  ,symbol text
  ,'name' text
  ,PRIMARY KEY (hgnc_id)
);

CREATE TABLE gene_coverage (
  hgnc_id text not null
  ,coverage float
  ,'type' TEXT
  ,PRIMARY KEY (hgnc_id, 'type')
  ,FOREIGN KEY (hgnc_id) REFERENCES genenames(hgnc_id)
);
