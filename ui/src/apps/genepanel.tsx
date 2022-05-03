import * as React from "react";
import { createRoot } from "react-dom/client";
import { AppStateContext, DbScaffold } from "../components/dbscaffold";

function GeneApp(props: any) {
  return (
    <DbScaffold title="Gene Panel">
      <AppStateContext.Consumer>
        {(value) => <h1>{value}</h1>}
      </AppStateContext.Consumer>
      sdf
    </DbScaffold>
  );
}

const rootElement = document.getElementById("app");
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<GeneApp />);
}
