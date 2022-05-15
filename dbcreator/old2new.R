# set global R options
options(
  stringsAsFactors = FALSE,
  warn = 2 # error on warnings
)

data_path_input <- "genepanels/legacy/"
data_path_converted <- "genepanels/legacy2new/"

cols_out <- c(
  "chromosome"
  ,"txStart"
  ,"txEnd"
  ,"refseq"
  ,"source"
  ,"score"
  ,"strand"
  ,"geneSymbol"
  ,"HGNC"
  ,"OMIM gene entry"
  ,"geneAlias"
  ,"inheritance"
  ,"cdsStart"
  ,"cdsEnd"
  ,"exonStarts"
  ,"exonEnds"
  ,"metadata"
)


genepanel_dirs <- list.files(path=data_path_input)
for (genepanel_id in genepanel_dirs) {
  if (!file.info(file.path(data_path_input, genepanel_id))$isdir) {
    next()
  }
  write(genepanel_id, "")

  # read transcript file
  tsfn_in <- file.path(data_path_input, genepanel_id, sprintf("%s.transcripts.csv", genepanel_id))
  tsdata <- read.table(tsfn_in, sep="\t", comment.char="", skip=1, header=T, quote="")


  tsdir_out <- file.path(data_path_converted, genepanel_id)
  dir.create(tsdir_out, recursive=T, showWarnings=F)
  tsfn_out <- file.path(tsdir_out, sprintf("%s_genes_transcripts_regions.tsv", genepanel_id))

  write(sprintf("# Gene panel: %s -- Date: 20XX-XX-XX", genepanel_id), tsfn_out)
  write(sprintf("#%s", paste(cols_out, collapse="\t")), tsfn_out, append=T)

  d <- data.frame(row.names=1:nrow(tsdata))
  for (col in cols_out) {
    if (!col %in% colnames(tsdata)) {
      d <- cbind(d, rep("", nrow(tsdata)))
      next()
    }
    d <- cbind(d, tsdata[,col])
  }
  write.table(d, tsfn_out, append=T, col.names=F, sep="\t", quote=F, row.names=F)
}
