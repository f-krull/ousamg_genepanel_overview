import { Database } from "sql.js";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { geneinfo, genepanels } from "../shared/sql";
import { Routes } from "../shared/routes";
import { DbContext, DbScaffold } from "../components/dbscaffold";
import { Description } from "../components/description";
import { UrlParam } from "../shared/urlParam";
import { Table, TableContext } from "../components/table";
import "tabulator-tables/dist/css/tabulator.css";
import "tabulator-tables/dist/css/tabulator_simple.css";
import { Section } from "../components/section";
import { formatCoverage, formatSegdup } from "../shared/format";

interface GenepanelEntryTree extends genepanels.GenepanelEntry {
  _children?: GenepanelEntryTree[];
  parent?: GenepanelEntryTree;
}

function GeneInfo({ db, hgncId }: { db: Database; hgncId: string }) {
  const geneinfoEntry = React.useMemo(() => {
    // get genes by ID
    const genes = geneinfo.searchByHgncId(db, hgncId);
    // select first gene
    const gene = genes[0];
    return gene;
  }, []);

  if (geneinfoEntry === undefined) {
    return <>no gene found with HGNC ID "{hgncId}"</>;
  }

  const genepanelTree = React.useMemo(() => {
    const genepanelRows = genepanels.searchByHgncId(db, hgncId);
    // convert to tree - start with latest gps as parent rows
    const tree: GenepanelEntryTree[] = genepanelRows.filter((e) => e.isLatest);
    // convert to GeneCountTree
    tree.forEach((r) => {
      r._children = genepanelRows
        .filter(
          (e) =>
            e.genepanelName === r.genepanelName &&
            e.genepanelVersion !== r.genepanelVersion
        )
        .map((c) => ({ ...c, parent: r }));
    });
    return tree;
  }, [hgncId]);

  return (
    <>
      <Section title="Gene">
        <div className="row gy-sm-2">
          <Description title="Gene symbol">{geneinfoEntry.symbol}</Description>
          <Description title="HGNC ID">
            {
              <>
                {geneinfoEntry.hgncId}{" "}
                <small className="text-muted">
                  (
                  <a
                    href={`https://www.genenames.org/data/gene-symbol-report/#!/hgnc_id/HGNC:${geneinfoEntry.hgncId}`}
                    target={"_blank"}
                  >
                    {"\u21AA"} genenames.org
                  </a>
                  )
                </small>
              </>
            }
          </Description>
          <Description title="Name">{geneinfoEntry.name}</Description>
          <Description title="Coverage">
            <span className="me-3">
              <span className="small">WGS</span>{" "}
              {formatCoverage(geneinfoEntry.coverageWgs)}
            </span>
            <span className="small">WES</span>{" "}
            {formatCoverage(geneinfoEntry.coverageWes)}
          </Description>
          <Description title="Seg. duplication">
            <span className="me-3">
              <span className="small">WGS</span>{" "}
              {formatSegdup(geneinfoEntry.segdupWgs)}
            </span>
            <span className="small">WES</span>{" "}
            {formatSegdup(geneinfoEntry.segdupWes)}
          </Description>
        </div>
      </Section>
      <Section
        title={`Gene panels containing ${geneinfoEntry.symbol} (HGNC:${geneinfoEntry.hgncId})`}
      >
        {genepanelTree.length && (
          <Table
            domId="genepanelTable"
            options={{
              data: genepanelTree,
              maxHeight: "60vh",
              layout: "fitDataFill",
              dataTree: true,
              dataTreeChildIndent: 25,
              dataTreeStartExpanded: true,
              columnDefaults: {
                title: "",
              },
              columns: [
                {
                  title: "Gene panel",
                  field: "genepanelName",
                  formatter: "link",
                  formatterParams: {
                    labelField: "genepanelName",
                    url: (e) => {
                      const dRow = e.getRow().getData();
                      return Routes.Genepanel({
                        name: dRow.genepanelName,
                        version: dRow.genepanelVersion,
                      });
                    },
                  },
                },
                {
                  title: "Version",
                  field: "genepanelVersion",
                  formatter: (e) => {
                    if (!e.getRow().getData().parent) {
                      return e.getValue();
                    }
                    const parent: GenepanelEntryTree = e.getRow().getData()
                      .parent as GenepanelEntryTree;
                    //? (e.getValue() as GeneCountTree). : ""
                    const url = Routes.GenepanelDiff(
                      {
                        name: e.getRow().getData().genepanelName,
                        version: e.getRow().getData().genepanelVersion,
                      },
                      {
                        name: parent.genepanelName,
                        version: parent.genepanelVersion,
                      }
                    );
                    return `${e.getValue()} (<a href="${url}">diff</a>)`;
                  },
                },
                {
                  title: "Default transcript",
                  field: "refseqIds",
                  mutator: (value) => value.join(", "),
                },
                {
                  title: "Transcript source",
                  field: "transcriptSource",
                },
                {
                  title: "Inheritance mode",
                  field: "inheritance",
                },
              ],
            }}
          >
            <TableContext.Consumer>
              {(table) => (
                <div className="row g-1 justify-content-end mb-2">
                  <div className="col-12 col-sm-2 col-lg-1">
                    <div
                      className="btn btn-outline-primary btn-sm w-100"
                      itemType="button"
                      onClick={() => {
                        table.getRows().forEach((r) => r.treeExpand());
                      }}
                    >
                      {" "}
                      Expand
                    </div>
                  </div>
                  <div className="col-12 col-sm-2 col-lg-1">
                    <div
                      className="btn btn-outline-primary btn-sm w-100"
                      itemType="button"
                      onClick={() => {
                        table.getRows().forEach((r) => r.treeCollapse());
                      }}
                    >
                      Collapse
                    </div>
                  </div>
                </div>
              )}
            </TableContext.Consumer>
          </Table>
        )}
      </Section>
    </>
  );
}

function GeneApp(props: any) {
  0;
  // get gene id
  const urlParams = new UrlParam();
  const hgncId = urlParams.get("hgnc_id");

  return (
    <DbScaffold title="Gene Info">
      <DbContext.Consumer>
        {(db) => {
          if (!hgncId) {
            // TODO: set error
            return <>no HGNC ID defined</>;
          }
          return <GeneInfo db={db} hgncId={hgncId} />;
        }}
      </DbContext.Consumer>
    </DbScaffold>
  );
}

const rootElement = document.getElementById("app");
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<GeneApp />);
}
