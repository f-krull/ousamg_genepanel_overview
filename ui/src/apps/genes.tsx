import React = require("react");
import { createRoot } from "react-dom/client";
import { Database } from "sql.js";
import { DbContext, DbScaffold } from "../components/dbscaffold";
import { TableContext, Table } from "../components/table";
import { Routes } from "../shared/routes";
import { genepanels } from "../shared/sql";
import { UrlParam } from "../shared/urlParam";
import "tabulator-tables/dist/css/tabulator.css";
import "tabulator-tables/dist/css/tabulator_simple.css";
import { Section } from "../components/section";
import { cols } from "../shared/tableColumns";
import { GeneList } from "../components/genelist";
import { Tabulator } from "tabulator-tables";
import { DownloadTable } from "../components/downloadtable";
import { MenuPages } from "../components/scaffold";

interface GeneCountTree extends genepanels.GeneCount {
  _children?: GeneCountTree[];
  numHitsRel: number;
  parent?: GeneCountTree;
}

function getColDef(hgncIds: string[]): Tabulator.ColumnDefinition[] {
  return [
    cols.genepanelName,
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
            name: e.getRow().getData().name,
            version: e.getRow().getData().version,
          },
          parent
        );
        return `${e.getValue()} (<a href="${url}">diff</a>)`;
      },
    },
    cols.genepanelDateCreated,
    {
      //column group
      title: "Num. hits",
      columns: [
        {
          title: "Total",
          field: "numHits",
          hozAlign: "right",
        },
        {
          title: "",
          field: "numHitsRel",
          formatter: "progress",
          minWidth: 80,
        },
        {
          title: "%",
          field: "numHitsRel",
          mutator: (value) => value * 100,
          hozAlign: "right",
          formatter: (e) => `${e.getValue().toFixed(1)}%`,
        },
      ],
    },
    {
      title: "",
      formatter: (e) => {
        const row = e.getRow().getData() as GeneCountTree;
        return `<a href="${Routes.GenepanelGeneOverlap(
          row,
          hgncIds
        )}">overlap</a>`;
      },
    },
  ];
}

function GenePanels({ db, hgncIds }: { db: Database; hgncIds: string[] }) {
  const [geneCounts, setGeneCounts] = React.useState<GeneCountTree[]>([]);

  const [table, setTable] = React.useState<Tabulator>();

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
    if (table) {
      try {
        table.setData(tree);
        table.setColumns(getColDef(hgncIds));
      } catch (e) {
        // whatever
        console.error(e);
      }
    }
  }, [hgncIds]);

  if (!geneCounts.length) {
    return <></>;
  }

  return (
    <>
      <Table
        domId="genepanels"
        onCreated={(t) => setTable(t)}
        options={{
          data: geneCounts,
          maxHeight: "60vh",
          layout: "fitDataFill",
          columnDefaults: {
            title: "",
          },
          dataTree: true,
          dataTreeChildIndent: 25,
          dataTreeStartExpanded: true,
          columns: getColDef(hgncIds),
        }}
      >
        <TableContext.Consumer>
          {(table) => {
            return (
              <>
                {/* <TableUpdater table={table} geneCounts={geneCounts} /> */}
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
                  <div className="col-12 col-sm-2">
                    <DownloadTable
                      table={table}
                      db={db}
                      fn={`genepanel-overlap`}
                    />
                  </div>
                </div>
              </>
            );
          }}
        </TableContext.Consumer>
      </Table>
      <div className="mb-5" />
    </>
  );
}

function Genes({ db, hgncIds }: { db: Database; hgncIds: string[] }) {
  const [includedHgncIds, setIncludedHgncIds] =
    React.useState<string[]>(hgncIds);

  return (
    <>
      <Section
        title={`Selected genes (${
          includedHgncIds.length !== hgncIds.length
            ? `${includedHgncIds.length}/`
            : ""
        }${hgncIds.length})`}
      >
        <GeneList
          db={db}
          hgncIds={hgncIds}
          onUpdateFilter={(ids) => setIncludedHgncIds(ids)}
        />
      </Section>
      <Section title="Gene panel overlap with selection">
        <GenePanels db={db} hgncIds={includedHgncIds} />
      </Section>
    </>
  );
}

function GenesApp(props: any) {
  // get gene ids
  const urlParams = new UrlParam();
  const hgncIds = urlParams.getList("hgnc_ids") || [];

  return (
    <DbScaffold title="Gene Set Info" currentPage={MenuPages.searchGenes}>
      <DbContext.Consumer>
        {(db) => {
          if (hgncIds.length === 0) {
            // TODO: set error
            return <>no HGNC IDs defined</>;
          }
          return <Genes db={db} hgncIds={hgncIds} />;
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
