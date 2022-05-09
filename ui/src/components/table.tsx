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

export function Table({ options }: { options: Tabulator.Options }) {
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
