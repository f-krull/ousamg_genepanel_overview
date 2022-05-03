#!/usr/bin/env Rscript

if ( !( "RSQLite" %in% rownames(installed.packages()) ) ) {
  cat("Please install the RSQLite package:\n   > install.packages(\"RSQLite\")\n\n")
}

#-------------------------------------------------------------------------------

# set global R options
options(
  stringsAsFactors = FALSE,
  warn = 2 # error on warnings
)

#-------------------------------------------------------------------------------

# constants

data_path <- "genepanels/production/"
data_path <- "genepanels/legacy2new/"

#-------------------------------------------------------------------------------

get_genepanel_name <- function(genepanel_id) {
  return(strsplit(genepanel_id, "_")[[1]][1])
}

get_genepanel_version <- function(genepanel_id) {
  return(strsplit(genepanel_id, "_")[[1]][2])
}

import_transcripts <- function(db, data_path, genepanel_id) {
  colGeneSymbol <- "geneSymbol"
  colHgnc <- "HGNC"
  colRefSeq <- "refseq"
  colSource <- "source"
  colInheritance <- "inheritance"
  genepanel_name    <- get_genepanel_name(genepanel_id)
  genepanel_version <- get_genepanel_version(genepanel_id)
  # read transcript file
  tsfn <- file.path(data_path, genepanel_id, sprintf("%s_genes_transcripts_regions.tsv", genepanel_id))
  tsdata <- read.table(tsfn, sep="\t", comment.char="", skip=1, header=T, quote="")
  rs <- DBI::dbSendStatement(db,
    'INSERT INTO genepanels (
      id
      , genepanel_name
      , genepanel_version
      , transcript
      , transcript_source
      , inheritance
    ) VALUES (
      :id
      , :genepanel_name
      , :genepanel_version
      , :transcript
      , :transcript_source
      , :inheritance
    )')
  for (i in 1:nrow(tsdata)) {
    DBI::dbBind(rs, params = list(
        id=tsdata[i,colHgnc]
        , genepanel_name=genepanel_name
        , genepanel_version=genepanel_version
        , transcript=tsdata[i,colRefSeq]
        , transcript_source=tsdata[i,colSource]
        , inheritance=tsdata[i,colInheritance]
      )
    )
  }
  DBI::dbClearResult(rs)
}

import_genenames <- function(db, file_path) {
  colHgncId         <- "HGNC.ID"
  colApprovedSymbol <- "Approved.symbol"
  colApprovedName   <- "Approved.name"
  #  [4] "Status"            "Previous.symbols"  "Alias.symbols"    
  #  [7] "Chromosome"        "Accession.numbers" "RefSeq.IDs"       
  # [10] "Alias.names"
  d_gn <- read.table(file_path, sep="\t", header=T, fill=T, quote="")
  # patch first col ("HGNC:11297" -> "11297")
  d_gn[,colHgncId] <- sub("^HGNC:","",d_gn[,colHgncId])
  rs <- DBI::dbSendStatement(db,
    'INSERT INTO genenames (
      hgnc_id
      , symbol
      , name
    ) VALUES (
      :hgnc_id
      , :symbol
      , :name
    )')
  for (i in 1:nrow(d_gn)) {
    DBI::dbBind(rs, params = list(
        hgnc_id=d_gn[i,colHgncId]
        , symbol=d_gn[i,colApprovedSymbol]
        , name=d_gn[i,colApprovedName]
      )
    )
    #write(capture.output(rs),"")
  }
  DBI::dbClearResult(rs)
}


#-------------------------------------------------------------------------------

# init db

db_file <- "gp_01.sqlite"
if (file.exists(db_file)) {
  file.remove(db_file)
}
db <- DBI::dbConnect(RSQLite::SQLite(), db_file)
if (!interactive()) {
  on.exit(
    DBI::dbDisconnect(db)
  )
}

DBI::dbExecute(db,
  'CREATE TABLE genepanels (
    id TEXT
    ,genepanel_name TEXT
    ,genepanel_version TEXT
    ,transcript TEXT
    ,transcript_source TEXT
    ,inheritance TEXT
  )'
)

DBI::dbExecute(db,
  'CREATE TABLE genenames (
    hgnc_id TEXT
    ,symbol TEXT
    ,name TEXT
  )'
)

DBI::dbExecute(db,
  'CREATE TABLE version (
    sha1 TEXT
    , date TEXT
    , label TEXT
  )'
)
  rs <- DBI::dbSendStatement(db,
    'INSERT INTO version (
      sha1
      , date
      , label
    ) VALUES (
      :sha1
      , :date
      , :label
    )')

  DBI::dbBind(rs, params = list(
      sha1=Sys.getenv("SHA1", unset="000000")
      , date=Sys.getenv("DATE", unset=strftime(as.POSIXlt(Sys.time(), "UTC"), "%Y-%m-%dT%H:%M:%S%z"))
      , label=Sys.getenv("LABEL", unset="undefined")
    )
  )
  DBI::dbClearResult(rs)


#-------------------------------------------------------------------------------

import_genenames(db, "./genenames.tsv")

# read genepanels

genepanel_dirs <- list.files(path=data_path)
for (genepanel_id in genepanel_dirs) {
  write(genepanel_id,"")
  import_transcripts(db, data_path, genepanel_id)
  # write(
  #   capture.output(
  #     tsdata[, c(colHgnc,colGeneSymbol)]
  #   )
  #   ,""
  # )
}

cat("ok\n")
