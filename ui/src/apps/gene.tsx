import { Database } from "sql.js";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { genenames, genepanels } from "../shared/sql";
import { Routes } from "../shared/routes";
import { DbContext, DbScaffold } from "../components/dbscaffold";
import { Description } from "../components/description";
import { UrlParam } from "../shared/urlParam";
import { Table } from "../components/table";
import "tabulator-tables/dist/css/tabulator.css";
import "tabulator-tables/dist/css/tabulator_simple.css";
import { Section } from "../components/section";

function GeneInfo({ db, hgncId }: { db: Database; hgncId: string }) {
  const genenameEntry = React.useMemo(() => {
    // get genes by ID
    const genes = genenames.searchByHgncId(db, hgncId);
    // select first gene
    const gene = genes[0];
    return gene;
  }, []);

  const genepanelRows = React.useMemo(() => {
    const genepanelRows = genepanels.searchLatestByHgncId(db, hgncId);
    return genepanelRows;
  }, []);

  if (genenameEntry === undefined) {
    return <>no gene found with HGNC ID "{hgncId}"</>;
  }

  return (
    <>
      <Section title="Gene">
        <div className="row gy-sm-2">
          <Description title="Gene symbol">{genenameEntry.symbol}</Description>
          <Description title="HGNC ID">
            {
              <>
                {genenameEntry.hgncId}{" "}
                <small className="text-muted">
                  (
                  <a
                    href={`https://www.genenames.org/data/gene-symbol-report/#!/hgnc_id/HGNC:${genenameEntry.hgncId}`}
                    target={"_blank"}
                  >
                    {"\u21AA"} genenames.org
                  </a>
                  )
                </small>
              </>
            }
          </Description>
          <Description title="Name">{genenameEntry.name}</Description>
        </div>
      </Section>
      <Section
        title={`Gene panels containing ${genenameEntry.symbol} (${genenameEntry.hgncId})`}
      >
        {genepanelRows.length && (
          <Table
            domId="genepanelTable"
            options={{
              data: genepanelRows,
              height: "60vh",
              layout: "fitColumns",
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
                  title: "Latest version",
                  field: "genepanelVersion",
                },
                {
                  title: "Default transcript",
                  field: "refseqId",
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
          />
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
