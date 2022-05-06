import { Database } from "sql.js";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { genenames, genepanels } from "../shared/sql";
import { Routes } from "../shared/routes";
import { Tabulator, FormatModule, SortModule } from "tabulator-tables";
import "tabulator-tables/dist/css/tabulator.css";
import "tabulator-tables/dist/css/tabulator_bootstrap5.css";
import { DbContext, DbScaffold } from "../components/dbscaffold";
import { Description } from "../components/description";

function Table({
  genepanelRows,
}: {
  genepanelRows: genepanels.GenepanelEntry[];
}) {
  React.useLayoutEffect(() => {
    Tabulator.registerModule(SortModule);
    Tabulator.registerModule(FormatModule);
    var table = new Tabulator("#table", {
      data: genepanelRows,
      //table setup options
      height: "60vh", // set height of table (in CSS or here), this enables the Virtual DOM and improves render speed dramatically (can be any valid css height value)
      layout: "fitColumns", //fit columns to width of table (optional)
      columnDefaults: {
        title: "",
      },
      columns: [
        //Define Table Columns
        {
          title: "Gene panel",
          field: "genepanelName",
          formatter: "link",
          formatterParams: {
            labelField: "genepanelName",
            url: (e) => {
              const dRow = e.getRow().getData();
              return Routes.Genepanel(
                dRow.genepanelName,
                dRow.genepanelVersion
              );
            },
          },
        },
        {
          title: "Latest version",
          field: "genepanelVersion",
        },
        {
          title: "Default transcript",
          field: "transcript",
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
    });
    const redraw = () => table.redraw();
    window.addEventListener("resize", redraw);
    return () => window.removeEventListener("resize", redraw);
  }, []);
  return <div id="table"></div>;
}

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
      <Description k="Gene symbol" v={genenameEntry.symbol} />
      <Description
        k="HGNC ID"
        v={
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
      />
      <Description k="Name" v={genenameEntry.name} />
      <hr />
      <div className="my-2">
        <div className="text-muted small fw-bold">Gene Panels</div>
      </div>
      <Table genepanelRows={genepanelRows || []} />
    </>
  );
}

function GeneApp(props: any) {
  // get gene id
  const urlParams = new URL(document.location.href).searchParams;
  const hgncId = urlParams.get("hgncId") || undefined;

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
