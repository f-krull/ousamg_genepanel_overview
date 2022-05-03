import SqlJs, { Database } from "sql.js";
import * as React from "react";
import { render } from "react-dom";
import { MenuPages, Scaffold } from "../components/scaffold";
import ReactDOM = require("react-dom");
import { createRoot } from "react-dom/client";
import { AppStatus } from "../shared/appstatus";
import { genenames } from "../shared/sql";
import { Routes } from "../shared/routes";
import { fetchWithProgress } from "../shared/api";
import { DbContext, DbScaffold } from "../components/dbscaffold";

function ProgressBar({ progress }: { progress: number | undefined }) {
  return (
    <div className="progress">
      <div
        className="progress-bar progress-bar-striped progress-bar-animated"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        style={{ width: progress ? `${progress * 100}%` : "100%" }}
      ></div>
    </div>
  );
}

function SearchGene({
  db,
  onInput,
}: {
  db: Database;
  geneSymbols: string[];
  onInput: (geneCandidates: genenames.GenenameEntry[]) => void;
}) {
  return (
    <div className="mb-3">
      <label htmlFor="inpGenesymbol" className="form-label">
        Gene symbol
      </label>
      <input
        type="text"
        className="form-control"
        id="inpGenesymbol"
        placeholder="BRCA3"
        list="inpGenesymbolOptions"
        onInput={(e) => {
          const q = e.currentTarget.value;
          if (q.length < 2) {
            onInput([]);
            return;
          }
          const genes = genenames.searchByPrefix(db, q);
          onInput(genes);
        }}
      />
      {/* <datalist id="inpGenesymbolOptions">
        {geneSymbols.map((o) => (
          <option key={o} value={o}></option>
        ))}
      </datalist> */}
    </div>
  );
}

function SearchHgnc({
  db,
  onInput,
}: {
  db: Database;
  onInput: (geneCandidates: genenames.GenenameEntry[]) => void;
}) {
  return (
    <div className="mb-3">
      <label htmlFor="inpHgncId" className="form-label">
        HGNC ID
      </label>
      <input
        type="number"
        className="form-control"
        id="inpHgncId"
        placeholder="18617"
        onInput={(e) => {
          const q = e.currentTarget.value;
          if (q.length == 0) {
            onInput([]);
            return;
          }
          const genes = genenames.searchByHgncId(db, q);
          onInput(genes);
        }}
      />
    </div>
  );
}

const getGeneUrl = (hgncId: string) => `${Routes.Gene}?hgncId=${hgncId}`;

function HomeApp(props: any) {
  const [geneCandidates, setGeneCandidates] = React.useState<
    genenames.GenenameEntry[]
  >([]);

  return (
    <DbScaffold title="Single Gene Search" currentPage={MenuPages.searchGene}>
      <DbContext.Consumer>
        {(db) => (
          <>
            <SearchGene
              db={db}
              geneSymbols={Array.from(
                new Set<string>(geneCandidates.map((e) => e.symbol))
              )}
              onInput={(r) => {
                setGeneCandidates(r);
              }}
            />
            <SearchHgnc
              db={db}
              onInput={(r) => {
                setGeneCandidates(r);
              }}
            />
            <table className="table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>HGNC ID</th>
                  <th>Name</th>
                </tr>
              </thead>
              <tbody>
                {geneCandidates.map((c) => {
                  const url = getGeneUrl(c.hgncId);
                  return (
                    <tr
                      className="link-primary"
                      key={`${c.name}_${c.hgncId}`}
                      role="button"
                      onClick={() => window.location.assign(url)}
                    >
                      <td>
                        <a href={url}>{c.symbol}</a>
                      </td>
                      <td>{c.hgncId}</td>
                      <td>{c.name}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {geneCandidates.length === 1 && (
              <>
                <div
                  role="button"
                  className="btn btn-primary"
                  onClick={() =>
                    window.location.assign(getGeneUrl(geneCandidates[0].hgncId))
                  }
                >
                  Select gene
                </div>
              </>
            )}
          </>
        )}
      </DbContext.Consumer>
    </DbScaffold>
  );
}

const rootElement = document.getElementById("app");
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<HomeApp />);
}
