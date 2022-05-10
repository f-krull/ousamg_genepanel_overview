import React = require("react");
import { Database } from "sql.js";
import { Tabulator } from "tabulator-tables";
import { geneinfo } from "../shared/sql";
import { Table, TableContext } from "./table";

function RangeInput({
  title,
  initialValue,
  onChange,
}: {
  title: string;
  initialValue: number;
  onChange: (v: number) => void;
}) {
  const [value, setValue] = React.useState<number>(initialValue);

  const callback = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseInt(e.currentTarget.value);
    setValue(v);
    onChange(v);
  };

  return (
    <div className="row">
      <div className="col-2">
        <label htmlFor="inpWes" className="form-label">
          {title}
        </label>
      </div>
      <div className="col-6">
        <input
          type="range"
          className="form-range"
          id="inpWes"
          value={value}
          onChange={callback}
        />
      </div>
      <div className="col-4">
        <input
          type={"number"}
          className="form-control"
          value={value}
          onChange={callback}
        />
      </div>
    </div>
  );
}

interface Filter {
  wesMin: number;
  wgsMin: number;
}

export function GeneList({ db, hgncIds }: { db: Database; hgncIds: string[] }) {
  const [filter, setFilter] = React.useState<Filter>({
    wesMin: 0,
    wgsMin: 0,
  });

  const geneEntries: geneinfo.GeneInfoEntry[] = React.useMemo(
    () =>
      hgncIds
        .map((id) => geneinfo.searchByHgncId(db, id))
        .flat()
        .sort((a, b) => a.symbol.localeCompare(b.symbol)),
    []
  );

  const getGeneEntriesFiltered = (
    geneEntries: geneinfo.GeneInfoEntry[],
    filter: Filter
  ) => {
    return geneEntries.filter((e) => {
      let pass = true;
      pass =
        pass && (e.coverageWgs === undefined || e.coverageWgs >= filter.wgsMin);
      pass =
        pass && (e.coverageWes === undefined || e.coverageWes >= filter.wesMin);
      return pass;
    });
  };

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
    >
      <TableContext.Consumer>
        {(table) => {
          return (
            <div className="row g-1 justify-content-end mb-2 gx-3">
              <div className="col-12 col-md-6 col-lg-4">
                <RangeInput
                  title="WGS"
                  initialValue={0}
                  onChange={(e) => {
                    const fn = { ...filter };
                    fn.wgsMin = e / 100;
                    setFilter(fn);
                    table.setData(getGeneEntriesFiltered(geneEntries, fn));
                  }}
                />
              </div>
              <div className="col-12 col-md-6 col-lg-4">
                <RangeInput
                  title="WES"
                  initialValue={0}
                  onChange={(e) => {
                    const fn = { ...filter };
                    fn.wesMin = e / 100;
                    setFilter(fn);
                    table.setData(getGeneEntriesFiltered(geneEntries, fn));
                  }}
                />
              </div>
            </div>
          );
        }}
      </TableContext.Consumer>
    </Table>
  );
}
