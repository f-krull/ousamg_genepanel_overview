import { Tabulator } from "tabulator-tables";
import { formatDate } from "./format";
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
    // formatter: (e) => {
    //   if (!e.getRow().getData().parent) {
    //     return e.getValue();
    //   }
    //   const parent: GeneCountTree = e.getRow().getData()
    //     .parent as GeneCountTree;
    //   //? (e.getValue() as GeneCountTree). : ""
    //   const url = Routes.GenepanelDiff(
    //     {
    //       name: e.getRow().getData().name,
    //       version: e.getRow().getData().version,
    //     },
    //     parent
    //   );
    //   return `${e.getValue()} (<a href="${url}">diff</a>)`;
    // },
  },
  genepanelDateCreated: {
    title: "Date created",
    field: "dateCreated",
    formatter: (e: any) =>
      e.getValue() === undefined ? "" : formatDate(e.getValue() as Date),
  },
};
