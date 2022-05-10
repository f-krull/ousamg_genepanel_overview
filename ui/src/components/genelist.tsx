import React = require("react");
import { Database } from "sql.js";
import { geneinfo } from "../shared/sql";
import { Table } from "./table";

export function GeneList({ db, hgncIds }: { db: Database; hgncIds: string[] }) {
  const geneEntries: geneinfo.GeneInfoEntry[] = React.useMemo(
    () =>
      hgncIds
        .map((id) => geneinfo.searchByHgncId(db, id))
        .flat()
        .sort((a, b) => a.symbol.localeCompare(b.symbol)),
    []
  );
  return (
    <Table
      domId="geneListTable"
      options={{
        data: geneEntries,
        maxHeight: "60vh",
        layout: "fitDataFill",
        columns: [
          {
            title: "HGNC ID",
            field: "hgncId",
          },
          {
            title: "Symbol",
            field: "symbol",
          },
          {
            title: "Name",
            field: "name",
          },
          {
            //column group
            title: "Coverage",
            columns: [
              {
                title: "WGS",
                field: "coverageWgs",
                hozAlign: "right",
                formatter: (e) => `${(e.getValue() * 100).toFixed(1)}%`,
              },
              {
                title: "WES",
                field: "coverageWes",
                hozAlign: "right",
                formatter: (e) => `${(e.getValue() * 100).toFixed(1)}%`,
              },
            ],
          },
        ],
      }}
    ></Table>
  );
}
