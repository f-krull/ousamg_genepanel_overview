import React = require("react");
import { createRoot } from "react-dom/client";
import { Database } from "sql.js";
import { DbContext, DbScaffold } from "../components/dbscaffold";
import { TableContext, Table } from "../components/table";
import { Routes } from "../shared/routes";
import { genenames, genepanels } from "../shared/sql";
import { UrlParam } from "../shared/urlParam";
import "tabulator-tables/dist/css/tabulator.css";
import "tabulator-tables/dist/css/tabulator_simple.css";
import { Section } from "../components/section";
import { formatDate } from "../shared/format";

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
      className="mb-5"
      domId="genepanels"
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
                  name: e.getRow().getData().name,
                  version: e.getRow().getData().version,
                },
                parent
              );
              return `${e.getValue()} (<a href="${url}">diff</a>)`;
            },
          },
          {
            title: "Date created",
            field: "dateCreated",
            formatter: (e: any) =>
              e.getValue() === undefined
                ? ""
                : formatDate(e.getValue() as Date),
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
  );
}

function GeneList({ db, hgncIds }: { db: Database; hgncIds: string[] }) {
  const geneEntries: genenames.GenenameEntry[] = hgncIds
    .map((id) => genenames.searchByHgncId(db, id))
    .flat()
    .sort((a, b) => a.symbol.localeCompare(b.symbol));
  return (
    <div className="row">
      {geneEntries.map((e) => (
        <div key={e.hgncId} className="col-3 col-sm-3 col-md-2">
          <a href={Routes.Gene(e.hgncId)}>
            {e.symbol} ({e.hgncId})
          </a>
        </div>
      ))}
    </div>
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
          return (
            <>
              <Section title="Selected genes">
                <GeneList db={db} hgncIds={hgncIds} />
              </Section>
              <Section title="Gene panels">
                <GenePanels db={db} hgncIds={hgncIds} />
              </Section>
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
