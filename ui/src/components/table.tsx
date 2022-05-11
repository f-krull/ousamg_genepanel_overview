import React = require("react");
import {
  Tabulator,
  FormatModule,
  SortModule,
  DataTreeModule,
  MutatorModule,
  ResizeColumnsModule,
} from "tabulator-tables";
import "tabulator-tables/dist/css/tabulator.css";
// import "tabulator-tables/dist/css/tabulator_materialize.css";
//import "tabulator-tables/dist/css/tabulator_bootstrap5.css";

function _Table({ options }: { options: Tabulator.Options }) {
  React.useLayoutEffect(() => {
    Tabulator.registerModule(SortModule);
    Tabulator.registerModule(FormatModule);
    Tabulator.registerModule(DataTreeModule);
    Tabulator.registerModule(MutatorModule);
    Tabulator.registerModule(ResizeColumnsModule);
    var table = new Tabulator("#table", options);
    const redraw = () => table.redraw();
    window.addEventListener("resize", redraw);
    return () => window.removeEventListener("resize", redraw);
  }, []);
  return <div id="table"></div>;
}

export const TableContext = React.createContext<Tabulator>({} as Tabulator);

export function Table({
  options,
  domId,
  children,
  className,
  onCreated,
}: {
  options: Tabulator.Options;
  children?: React.ReactNode;
  domId: string;
  className?: string;
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
      <div className={className} id={domId}></div>
    </>
  );
}
