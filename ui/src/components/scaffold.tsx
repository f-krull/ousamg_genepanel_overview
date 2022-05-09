import * as React from "react";
import { Database } from "sql.js";
import { Routes } from "../shared/routes";
import { version } from "../shared/sql";

export enum MenuPages {
  searchGene = "Single gene",
  searchGenes = "Multiple genes",
  genepanelDiff = "Compare panels",
}

type MenuEnties = Record<MenuPages, { url: string }>;

export function Scaffold(props: {
  title: React.ReactNode;
  children: React.ReactNode;
  db: Database | undefined;
  currentPage?: MenuPages;
}) {
  const versionEntry: version.VersionEntry | undefined = React.useMemo(() => {
    if (!props.db) {
      return undefined;
    }
    return version.getVersion(props.db);
  }, [props.db]);

  const menuEntries: MenuEnties = {
    [MenuPages.searchGene]: {
      url: Routes.Home,
    },
    [MenuPages.searchGenes]: {
      url: Routes.InpGenes,
    },
    [MenuPages.genepanelDiff]: {
      url: Routes.GenepanelDiff(),
    },
  };

  const vchild =
    versionEntry !== undefined ? (
      <>
        <small className="text-muted">
          <span>
            {" "}
            updated {versionEntry.date.toLocaleString()} (SHA1:{" "}
            {versionEntry.sha1.substring(0, 7)})
          </span>
        </small>
      </>
    ) : (
      <></>
    );

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow">
        <div className="container">
          <a className="navbar-brand" href={Routes.Home}>
            <img width={56} height={56} src={require("../../img/logo.png")} />
            <strong className="ms-3">Gene Panel Overview</strong>
          </a>
          <ul className="navbar-nav me-lg-auto">
            {Object.entries(menuEntries).map(([k, v]) => (
              <li className="nav-item" key={k}>
                <a
                  className={`nav-link ${
                    props.currentPage === k ? "active" : ""
                  }`}
                  aria-current="page"
                  href={v.url}
                >
                  {k}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>
      <div className="container">
        <div className="row justify-content-between align-items-center">
          <div className="col-auto h1 my-3 text-muted">{props.title}</div>
          <div className="col-auto">{vchild}</div>
        </div>
        {props.children}
      </div>
    </>
  );
}
