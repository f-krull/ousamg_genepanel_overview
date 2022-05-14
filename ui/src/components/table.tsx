import React = require("react");
import {
  Tabulator,
  FormatModule,
  SortModule,
  DataTreeModule,
  MutatorModule,
  ResizeColumnsModule,
  DownloadModule,
  ExportModule,
} from "tabulator-tables";
import "tabulator-tables/dist/css/tabulator.css";

export const TableContext = React.createContext<Tabulator>({} as Tabulator);

export function Table({
  options,
  domId,
  children,
  onCreated,
}: {
  options: Tabulator.Options;
  children?: React.ReactNode;
  domId: string;
  onCreated?: (t: Tabulator) => void;
}) {
  const [table, setTable] = React.useState<Tabulator>();

  React.useLayoutEffect(() => {
    if (table) {
      return;
    }
    Tabulator.registerModule(SortModule);
    Tabulator.registerModule(FormatModule);
    Tabulator.registerModule(DataTreeModule);
    Tabulator.registerModule(MutatorModule);
    Tabulator.registerModule(ResizeColumnsModule);
    Tabulator.registerModule(DownloadModule);
    Tabulator.registerModule(ExportModule);
    var t = new Tabulator(`#${domId}`, options);
    setTable(t);
    if (onCreated) {
      onCreated(t);
    }
    const redraw = () => t.redraw();
    window.addEventListener("resize", redraw);
    return () => window.removeEventListener("resize", redraw);
  }, []);

  // only render children when table is initialized
  const cChildren = table ? (
    <TableContext.Provider value={table}>{children}</TableContext.Provider>
  ) : (
    <>...</>
  );

  return (
    <>
      {cChildren}
      <div id={domId}></div>
    </>
  );
}
