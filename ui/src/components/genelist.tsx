import React = require("react");
import { Database } from "sql.js";
import { Tabulator } from "tabulator-tables";
import { formatCoverage, formatSegdup } from "../shared/format";
import { Routes } from "../shared/routes";
import { geneinfo } from "../shared/sql";
import { DownloadTable } from "./downloadtable";
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
      <div className="col-4 text-end">
        <label htmlFor="inpWes" className="form-label">
          {title}
        </label>
      </div>
      <div className="col-4">
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

export function GeneList({
  db,
  hgncIds,
  domId = "geneListTable",
  onUpdateFilter,
  displayFilter = true,
}: {
  db: Database;
  hgncIds: string[];
  onUpdateFilter?: (includedHgncIds: string[]) => void;
  domId?: string;
  displayFilter?: boolean;
}) {
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
    [hgncIds]
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

  const updateFilter = (filter: Filter, table: Tabulator) => {
    setFilter(filter);
    const includedGenes = getGeneEntriesFiltered(geneEntries, filter);
    table.setData(includedGenes);
    if (onUpdateFilter) {
      onUpdateFilter(includedGenes.map((e) => e.hgncId));
    }
  };

  return (
    <Table
      domId={domId}
      options={{
        data: geneEntries,
        maxHeight: "60vh",
        layout: "fitDataFill",
        columns: [
          {
            title: "HGNC ID",
            field: "hgncId",
            formatter: "link",
            formatterParams: {
              labelField: "hgncId",
              url: (e) => {
                const dRow = e.getRow().getData() as geneinfo.GeneInfoEntry;
                return Routes.Gene(dRow.hgncId);
              },
            },
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
                formatter: (e) => formatCoverage(e.getValue()),
              },
              {
                title: "WES",
                field: "coverageWes",
                hozAlign: "right",
                formatter: (e) => formatCoverage(e.getValue()),
              },
            ],
          },
        ],
      }}
    >
      <TableContext.Consumer>
        {(table) => {
          return (
            <>
              <div className="row g-1 justify-content-start mb-2 gx-3 align-items-end">
                <div className="col-12 col-lg-8 me-auto">
                  {displayFilter && (
                    <div className="row border border-secondary p-2 rounded-3 mx-0">
                      <div className="col-12 text-muted mb-2">
                        Coverage filter
                      </div>
                      <div className="col-12 col-md-6 col-lg-6">
                        <RangeInput
                          title="min. WGS"
                          initialValue={0}
                          onChange={(e) => {
                            const fn = { ...filter }; // immutable update
                            fn.wgsMin = e / 100;
                            updateFilter(fn, table);
                          }}
                        />
                      </div>
                      <div className="col-12 col-md-6 col-lg-6">
                        <RangeInput
                          title="min. WES"
                          initialValue={0}
                          onChange={(e) => {
                            const fn = { ...filter }; // immutable update
                            fn.wesMin = e / 100;
                            updateFilter(fn, table);
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div className="col-12 col-sm-2">
                  <DownloadTable table={table} db={db} fn={`genes`} />
                </div>
              </div>
            </>
          );
        }}
      </TableContext.Consumer>
    </Table>
  );
}
