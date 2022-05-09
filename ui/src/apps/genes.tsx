import React = require("react");
import { createRoot } from "react-dom/client";
import { Database } from "sql.js";
import { DbContext, DbScaffold } from "../components/dbscaffold";
import { Table } from "../components/table";
import { Routes } from "../shared/routes";
import { genepanels } from "../shared/sql";
import { UrlParam } from "../shared/urlParam";
import "tabulator-tables/dist/css/tabulator.css";
import "tabulator-tables/dist/css/tabulator_simple.css";

interface GeneCountTree extends genepanels.GeneCount {
  _children?: GeneCountTree[];
  numHitsRel: number;
  parent?: GeneCountTree;
}

function GenePanels({ db, hgncIds }: { db: Database; hgncIds: string[] }) {
  const [geneCounts, setGeneCounts] = React.useState<GeneCountTree[]>([]);

  React.useEffect(() => {
    const g: GeneCountTree[] = genepanels
      .getCountByHgncIds(db, hgncIds)
      .map((e) => ({ ...e, numHitsRel: e.numHits / hgncIds.length }));

    // convert to tree - start with latest gps as parent rows
    const tree = g.filter((e) => e.isLatest);
    // convert to GeneCountTree
    tree.forEach((r) => {
      r._children = g
        .filter((e) => e.name === r.name && e.version !== r.version)
        .map((c) => ({ ...c, parent: r }));
    });
    setGeneCounts(tree);
  }, [hgncIds]);

  if (!geneCounts.length) {
    return <></>;
  }

  return (
    <Table
      options={{
        data: geneCounts,
        height: "60vh",
        layout: "fitDataFill",
        columnDefaults: {
          title: "",
        },
        dataTree: true,
        dataTreeChildIndent: 25,
        dataTreeStartExpanded: true,
        columns: [
          {
            title: "Gene panel",
            field: "name",
            formatter: "link",
            formatterParams: {
              labelField: "name",
              url: (e) => {
                const dRow = e.getRow().getData();
                return Routes.Genepanel({
                  name: dRow.name,
                  version: dRow.version,
                });
              },
            },
          },
          {
            title: "Version",
            field: "version",
            formatter: (e) => {
              if (!e.getRow().getData().parent) {
                return e.getValue();
              }
              const parent: GeneCountTree = e.getRow().getData()
                .parent as GeneCountTree;
              //? (e.getValue() as GeneCountTree). : ""
              const url = Routes.GenepanelDiff(
                {
                  name: parent.name,
                  version: parent.version,
                },
                {
                  name: e.getRow().getData().name,
                  version: e.getRow().getData().version,
                }
              );
              return `${e.getValue()} (<a href="${url}">compare</a>)`;
            },
          },
          {
            title: "Date created",
            field: "dateCreated",
            formatter: (e: any) =>
              e.getValue() === undefined
                ? ""
                : (e.getValue() as Date).toISOString().substring(0, 10),
          },
          {
            //column group
            title: "Num hits",
            columns: [
              {
                title: "Total",
                field: "numHits",
              },
              {
                title: "Coverage",
                field: "numHitsRel",
                formatter: "progress",
              },
              {
                title: "%",
                field: "numHitsRel",
                mutator: (value) => value * 100,
                formatter: (e) => `${e.getValue().toFixed(1)}%`,
              },
            ],
          },
        ],
      }}
    />
  );
}

function GenesApp(props: any) {
  // get gene ids
  const urlParams = new UrlParam();
  const hgncIds = urlParams.getList("hgnc_ids") || [];

  return (
    <DbScaffold title="Gene Set Info">
      <DbContext.Consumer>
        {(db) => {
          if (hgncIds.length === 0) {
            // TODO: set error
            return <>no HGNC IDs defined</>;
          }
          console.log("DbContext.Consumer render");
          return (
            <>
              <div className="my-2">
                <div className="text-muted small fw-bold">Gene Panels</div>
              </div>
              <GenePanels db={db} hgncIds={hgncIds} />
            </>
          );
        }}
      </DbContext.Consumer>
    </DbScaffold>
  );
}

const rootElement = document.getElementById("app");
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<GenesApp />);
}
