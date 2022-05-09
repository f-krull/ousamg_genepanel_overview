import React = require("react");
import { createRoot } from "react-dom/client";
import { Database } from "sql.js";
import { DbContext, DbScaffold } from "../components/dbscaffold";
import { MenuPages } from "../components/scaffold";
import { Section } from "../components/section";
import { Table, TableContext } from "../components/table";
import { genepanels } from "../shared/sql";
import { cols } from "../shared/tableColumns";

function GenepanelList({ db }: { db: Database }) {
  // const [query, setQuery] = React.useState<string | undefined>();

  const gps = React.useMemo(
    () => genepanels.getGenepanels(db).filter((g) => g.isLatest),
    []
  );
  const getTableData = (query: string) => {
    if (!query) {
      return gps;
    }
    const qUpper = query.toUpperCase();
    return gps.filter((g) => g.name.toUpperCase().includes(qUpper));
  };

  return (
    <Table
      domId="genepanelTable"
      options={{
        data: gps,
        height: "60vh",
        layout: "fitDataFill",
        columns: [
          cols.genepanelName,
          cols.genepanelVersion,
          cols.genepanelDateCreated,
        ],
      }}
    >
      <TableContext.Consumer>
        {(table) => (
          <div className="row g-1 justify-content-start mb-2">
            <label
              htmlFor="inpGenesymbol"
              className="col-5 col-sm-2 col-form-label"
            >
              Filter
            </label>
            <div className="col-7 col-sm-4">
              <input
                type="text"
                className="form-control form-control-sm"
                id="inpGenesymbol"
                placeholder="HBOC"
                list="inpGenesymbolOptions"
                onInput={(e) => {
                  table.setData(getTableData(e.currentTarget.value));
                }}
              />
            </div>
          </div>
        )}
      </TableContext.Consumer>
    </Table>
  );
}

function InpGenesApp(props: any) {
  return (
    <DbScaffold
      title="Gene Panel Search"
      currentPage={MenuPages.searchGenepanel}
    >
      <DbContext.Consumer>
        {(db) => (
          <Section title="Genepanels">{<GenepanelList db={db} />}</Section>
        )}
      </DbContext.Consumer>
    </DbScaffold>
  );
}

const rootElement = document.getElementById("app");
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<InpGenesApp />);
}
