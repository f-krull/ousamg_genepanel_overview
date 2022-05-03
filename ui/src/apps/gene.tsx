import SqlJs, { Database } from "sql.js";
import * as React from "react";
import { MenuPages, Scaffold } from "../components/scaffold";
import { createRoot } from "react-dom/client";
import { AppStatus } from "../shared/appstatus";
import { genenames, genepanels } from "../shared/sql";
import { Routes } from "../shared/routes";
import { ProgressBar } from "../components/progressbar";
import { fetchWithProgress } from "../shared/api";
import { Tabulator, FormatModule, SortModule } from "tabulator-tables";
import "tabulator-tables/dist/css/tabulator.css";
import "tabulator-tables/dist/css/tabulator_bootstrap5.css";
import { DbContext, DbScaffold } from "../components/dbscaffold";

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
            url: (e) => Routes.Genepanel(e.getValue()),
          },
        },
        {
          title: "Version",
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
  const [genenameEntry, setGenenameEntry] = React.useState<
    genenames.GenenameEntry | undefined
  >();
  const [genepanelRows, setGenepanelRows] = React.useState<
    genepanels.GenepanelEntry[] | undefined
  >();

  React.useEffect(() => {
    // get genes by ID
    const genes = genenames.searchByHgncId(db, hgncId);
    // select first gene
    const gene = genes[0];
    setGenenameEntry(gene);
    const genepanelRows = genepanels.searchLatestById(db, hgncId);
    setGenepanelRows(genepanelRows);
  }, [hgncId]);

  if (genenameEntry === undefined) {
    return <>no gene found with HGNC ID "{hgncId}"</>;
  }

  return (
    <>
      <div className="row mb-3">
        <div className="col-sm-2 text-muted">Gene symbol</div>
        <div className="col-sm-10">{genenameEntry.symbol}</div>
      </div>
      <div className="row mb-3">
        <div className="col-sm-2 text-muted">HGNC ID</div>
        <div className="col-sm-10">
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
        </div>
      </div>
      <div className="row mb-3">
        <div className="col-sm-2 text-muted">Name</div>
        <div className="col-sm-10">{genenameEntry.name}</div>
      </div>
      <hr />
      <div className="my-2">
        <small className="text-muted">Gene Panels</small>
      </div>
      <Table genepanelRows={genepanelRows || []} />
    </>
  );
}

function GeneApp(props: any) {
  // get note id
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
