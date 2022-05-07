import React = require("react");
import { createRoot } from "react-dom/client";
import { Database } from "sql.js";
import { DbContext, DbScaffold } from "../components/dbscaffold";
import { Table } from "../components/table";
import { Routes } from "../shared/routes";
import { genepanels } from "../shared/sql";
import { UrlParam } from "../shared/urlParam";

interface GeneCountTree extends genepanels.GeneCount {
  _children?: GeneCountTree[];
  numHitsRel: number;
}

function GenePanels({ db, hgncIds }: { db: Database; hgncIds: string[] }) {
  const geneCounts = React.useMemo(() => {
    const g: GeneCountTree[] = genepanels
      .getCountByHgncIds(db, hgncIds)
      .map((e) => ({ ...e, numHitsRel: e.numHits / hgncIds.length }));
    // convert to tree - start with latest gps as parent rows
    const tree = g.filter((e) => e.isLatest === 1);
    // convert to GeneCountTree
    tree.forEach((r) => {
      r._children = g.filter(
        (e) =>
          e.genepanelName === r.genepanelName &&
          e.genepanelVersion !== r.genepanelVersion
      );
    });
    return tree;
  }, [hgncIds]);

  return (
    <Table
      options={{
        data: geneCounts,
        height: "60vh",
        layout: "fitColumns",
        columnDefaults: {
          title: "",
        },
        dataTree: true,
        dataTreeChildIndent: 25,
        dataTreeStartExpanded: true,
        columns: [
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
            title: "Gene panel",
            field: "genepanelVersion",
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
                title: "Relative",
                field: "numHitsRel",
                mutator: (value) => value * 100,
                formatter: (e) => e.getValue().toFixed(1),
              },
              {
                title: "Coverage",
                field: "numHitsRel",
                formatter: "progress",
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
    <DbScaffold title="Gene Info">
      <DbContext.Consumer>
        {(db) => {
          if (hgncIds.length === 0) {
            // TODO: set error
            return <>no HGNC IDs defined</>;
          }
          return <GenePanels db={db} hgncIds={hgncIds} />;
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
