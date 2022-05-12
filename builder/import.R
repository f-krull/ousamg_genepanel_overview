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

db_exec_file <- function(db, path) {
  read_file <- function(path){
    readChar(path, file.info(path)$size)
  }
  sql_file <- read_file(path)
  for (sql_query in strsplit(sql_file, ";")[[1]]) {
    sql_query <- trimws(sql_query)
    if (sql_query == "") {
      next()
    }
    write(sql_query, "")
    DBI::dbExecute(db, sql_query)
  }
}

get_genepanel_name <- function(genepanel_id) {
  return(strsplit(genepanel_id, "_")[[1]][1])
}

get_genepanel_version <- function(genepanel_id) {
  return(strsplit(genepanel_id, "_")[[1]][2])
}

import_genepanel <- function(db, data_path, genepanel_id) {
  genepanel_name    <- get_genepanel_name(genepanel_id)
  genepanel_version <- get_genepanel_version(genepanel_id)
  date <- (function(){
    tsfn <- file.path(data_path, genepanel_id, sprintf("%s_genes_transcripts_regions.tsv", genepanel_id))
    # get first line
    line <- readLines(tsfn, n=2)[1]
    # parse date from first line -- yay \o/ thats how I like my data structures ...
    m <- regexpr("Date: [0-9-]{10}", line)
    l <- attr(m, "match.length")
    if (l == -1) {
      #return("1970-01-01")
      return(list(NULL))
    }
    return(substr(line, m+6, m+l-1))
  })()
  rs <- DBI::dbSendStatement(db,
    'INSERT INTO genepanels (
      name
      , version
      , date_created
    ) VALUES (
      :name
      , :version
      , :date_created
    )')
  DBI::dbBind(rs, params = list(
      name=genepanel_name
      ,version=genepanel_version
      ,date_created=date
    )
  )
  DBI::dbClearResult(rs)
}

import_genenames <- function(db, file_path) {
  cat("importing genenames\n")
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
  }
  DBI::dbClearResult(rs)
}

import_coverage <- function(db, file_path, type) {
  cat(sprintf("importing coverage %s\n", type))
  colHgncId    <- "gene.id"
  colCoverage  <- "Mean"
  d <- read.table(file_path, sep="\t", header=T, quote="")
  d[,colCoverage] <- sub("%","", d[,colCoverage])
  rs <- DBI::dbSendStatement(db,
    'INSERT INTO gene_coverage (
      hgnc_id
      , coverage
      , type
    ) VALUES (
      :hgnc_id
      , :coverage
      , :type
    )')
  for (i in 1:nrow(d)) {
    params = list(
      hgnc_id=d[i,colHgncId]
      , coverage=as.numeric(d[i,colCoverage])/100
      , type=type
    )
    DBI::dbBind(rs, params)
  }
  DBI::dbClearResult(rs)
}

import_seqdups <- function(db, file_path, type) {
  cat(sprintf("importing seqdups %s\n", type))
  colHgncId    <- "gene"
  colSegdup    <- "Mean"
  d <- read.table(file_path, sep="\t", header=T, quote="")
  d[,colSegdup] <- sub("%","", d[,colSegdup])
  rs <- DBI::dbSendStatement(db,
    'INSERT INTO gene_segdups (
      hgnc_id
      , segdup
      , type
    ) VALUES (
      :hgnc_id
      , :segdup
      , :type
    )')
  for (i in 1:nrow(d)) {
    params = list(
      hgnc_id=d[i,colHgncId]
      , segdup=as.numeric(d[i,colSegdup])/100
      , type=type
    )
    DBI::dbBind(rs, params)
  }
  DBI::dbClearResult(rs)
}

import_refseq <- function(db, file_path) {
  cat("importing refseq\n")
  colHgncId    <- "HGNC.ID"
  colRefSeqIds <- "RefSeq.IDs"
  d_rs <- read.table(file_path, sep="\t", header=T, fill=T, quote="")
  # patch first col ("HGNC:11297" -> "11297")
  d_rs[,colHgncId] <- sub("^HGNC:", "", d_rs[,colHgncId])
  rs <- DBI::dbSendStatement(db,
    'INSERT OR IGNORE INTO refseq (
      id
      , hgnc_id
    ) VALUES (
      :id
      , :hgnc_id
    )')
  for (i in 1:nrow(d_rs)) {
    for (refseq_id in strsplit(d_rs[i,colRefSeqIds], ",")[[1]]) {
      refseq_id <- trimws(refseq_id)
      DBI::dbBind(rs, params = list(
          id=refseq_id
          , hgnc_id=d_rs[i,colHgncId]
        )
      )
    }
  }
  DBI::dbClearResult(rs)
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

  # add any unknown refseqs
  rs <- DBI::dbSendStatement(db,
    'INSERT OR IGNORE INTO refseq (
      id
      , hgnc_id
    ) VALUES (
      :id
      , :hgnc_id
    )')
  for (i in 1:nrow(tsdata)) {
    DBI::dbBind(rs, params = list(
        id=tsdata[i,colRefSeq]
        , hgnc_id=tsdata[i,colHgnc]
      )
    )
  }
  DBI::dbClearResult(rs)
  # import regions
  rs <- DBI::dbSendStatement(db,
    'INSERT INTO genepanel_regions (
      genepanel_name
      , genepanel_version
      , refseq_id
      , custom_id
      , transcript_source
      , inh_mode
    ) VALUES (
      :genepanel_name
      , :genepanel_version
      , :refseq_id
      , :custom_id
      , :transcript_source
      , :inh_mode
    )')
  for (i in 1:nrow(tsdata)) {
    params = list(
      genepanel_name=genepanel_name
      , genepanel_version=genepanel_version
      , refseq_id=tsdata[i,colRefSeq]
      , custom_id=list(NULL)
      , transcript_source=tsdata[i,colSource]
      , inh_mode=tsdata[i,colInheritance]
    )
    # cat("test 2\n")
    # cat(capture.output(str(params)))
    # cat("\n")
    DBI::dbBind(rs, params)
  }
  DBI::dbClearResult(rs)
}

#-------------------------------------------------------------------------------

# init db

db_file <- "gp_01.sqlite"
if (file.exists(db_file)) {
  invisible(file.remove(db_file))
}
db <- DBI::dbConnect(RSQLite::SQLite(), db_file)
if (!interactive()) {
  on.exit(
    DBI::dbDisconnect(db)
  )
}
db_exec_file(db, "./create_db.sql")

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
invisible(
  DBI::dbBind(rs, params = list(
      sha1=Sys.getenv("SHA1", unset="000000")
      , date=Sys.getenv("DATE", unset=strftime(as.POSIXlt(Sys.time(), "UTC"), "%Y-%m-%dT%H:%M:%S%z"))
      , label=Sys.getenv("LABEL", unset="undefined")
    )
  )
)
invisible(
  DBI::dbClearResult(rs)
)


#-------------------------------------------------------------------------------

import_genenames(db, "dbs/genenames.tsv")
import_seqdups(db, "covdata/wgs/wgs_summary_segdups_coverage_genes_10x.tsv", "wgs")
import_seqdups(db, "covdata/wes/wes_summary_segdups_coverage_genes_10x.tsv", "wes")
import_coverage(db, "covdata/wgs/wgs_summary_coverage_genes_10x.tsv", "wgs")
import_coverage(db, "covdata/wes/wes_summary_coverage_genes_10x.tsv", "wes")
import_refseq(db, "dbs/genenames.tsv")
# read genepanels

cat("importing genepanel\n")
genepanel_dirs <- list.files(path=data_path)
for (genepanel_id in genepanel_dirs) {
  write(genepanel_id,"")
  import_genepanel(db, data_path, genepanel_id)
  import_transcripts(db, data_path, genepanel_id)
}

db_exec_file(db, "./finalize_db.sql")

cat("ok\n")
