import * as React from "react";
import SqlJs, { Database } from "sql.js";
import { fetchWithProgress } from "../shared/api";
import { AppStatus } from "../shared/appstatus";
import { version } from "../shared/sql";
import { ProgressBar } from "./progressbar";
import { MenuPages, Scaffold } from "./scaffold";

// Shows progress indicator while loading DB file
//  Children are ensured to have access to DB.

export const AppStateContext = React.createContext<AppStatus>(
  AppStatus.Loading
);

export const DbContext = React.createContext<Database>({} as Database);

export function DbScaffold({
  title,
  children,
  currentPage,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
  currentPage?: MenuPages;
}) {
  const [dlProgress, setDlProgress] = React.useState<number | undefined>();
  const [appState, setAppState] = React.useState<AppStatus>(AppStatus.Loading);
  const [db, setDb] = React.useState<Database | undefined>();

  React.useEffect(() => {
    // TODO: catch error and set app state
    (async () => {
      const buf = await fetchWithProgress("/gp_01.sqlite", (p) => {
        setDlProgress(p);
      });
      const config = {
        locateFile: (filename: string) => `./${filename}`,
      };
      const SQL = await SqlJs(config);
      const db = new SQL.Database(buf);
      setDb(db);
      setAppState(AppStatus.HasData);
    })();
  }, []);

  const scaffoldChildren = (() => {
    if (appState === AppStatus.Loading) {
      return (
        <div className="px-4 py-5 my-5 text-center">
          <div className="row">
            <div className="col text-center text-muted">Loading data...</div>
          </div>
          <div className="col text-center text-muted">
            {dlProgress !== undefined ? (dlProgress * 100).toFixed(1) : ""}%
          </div>
          <ProgressBar progress={dlProgress} />
          <div className="row"></div>
        </div>
      );
    }
    if (!db) {
      throw Error("internal error - DB not defined");
    }
    return <DbContext.Provider value={db}>{children}</DbContext.Provider>;
  })();

  return (
    <Scaffold title={title} db={db} currentPage={currentPage}>
      <AppStateContext.Provider value={appState}>
        {scaffoldChildren}
      </AppStateContext.Provider>
    </Scaffold>
  );
}
