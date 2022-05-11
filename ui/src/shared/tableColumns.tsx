import { Tabulator } from "tabulator-tables";
import { formatDate, naSymbol } from "./format";
import { Routes } from "./routes";

export const cols: { [k: string]: Tabulator.ColumnDefinition } = {
  genepanelName: {
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
  genepanelVersion: {
    title: "Version",
    field: "version",
  },
  genepanelDateCreated: {
    title: "Date created",
    field: "dateCreated",
    formatter: (e: any) =>
      e.getValue() === undefined ? naSymbol : formatDate(e.getValue() as Date),
  },
};
