import { Database } from "sql.js";
import * as React from "react";
import { MenuPages } from "../components/scaffold";
import { createRoot } from "react-dom/client";
import { genenames } from "../shared/sql";
import { Routes } from "../shared/routes";
import { DbContext, DbScaffold } from "../components/dbscaffold";

interface GeneLookupStatus {
  [k: string]: genenames.GenenameEntry[];
}

function GeneHit({
  children,
  error,
  key,
}: {
  children: React.ReactNode;
  error: boolean;
  key: string;
}) {
  return (
    <div className="col-12" key={key}>
      <span className={`badge rounded-pill bg-${error ? "danger" : "success"}`}>
        {children}
      </span>
    </div>
  );
}

function SearchGenes({
  db,
  onInput,
}: {
  db: Database;
  onInput: (geneCandidates: genenames.GenenameEntry[]) => void;
}) {
  const [geneLookupStatus, setGeneLookupStatus] =
    React.useState<GeneLookupStatus>({});

  return (
    <div className="mb-3 row">
      <div className="col-6">
        <label htmlFor="inpGenesymbol" className="my-1">
          Gene symbols / HGNC IDs:
        </label>
        <textarea
          className="form-control"
          id="inpGenesymbol"
          placeholder="BRCA2, NOTCH1, 3808"
          onInput={(e) => {
            const isNumeric = (str: string): boolean => {
              return RegExp("^[0-9]+$").test(str);
            };
            const q = e.currentTarget.value;
            const words: string[] = q
              .replace(/,/g, " ")
              .split(" ")
              .map((e) => e.trim())
              .filter((e) => e !== "");
            const glsUpdated: GeneLookupStatus = {};
            words.forEach((w) => {
              if (geneLookupStatus.hasOwnProperty(w)) {
                // already defined?
                glsUpdated[w] = geneLookupStatus[w];
              } else if (isNumeric(w[0])) {
                // hgnc ID?
                glsUpdated[w] = genenames.searchByHgncId(db, w);
              } else {
                // assume gene
                glsUpdated[w] = genenames.searchByGeneSymbol(
                  db,
                  w.toUpperCase()
                );
              }
              setGeneLookupStatus(glsUpdated);
            });
            const genes = genenames.searchByPrefix(db, q);
            onInput(genes);
          }}
        />
      </div>
      <div className="col-6">
        <div className="row">
          {Object.entries(geneLookupStatus)
            .map(([query, results]) => {
              if (results.length === 0) {
                return [
                  <GeneHit error={true} key={query}>
                    {query}
                  </GeneHit>,
                ];
              }
              return results.map((result) => (
                <GeneHit error={false} key={query}>
                  {`${result.symbol} (${result.hgncId}) ${result.name}`}
                </GeneHit>
              ));
            })
            .flat()}
        </div>
      </div>
    </div>
  );
}

function InpGenesApp(props: any) {
  const [geneCandidates, setGeneCandidates] = React.useState<
    genenames.GenenameEntry[]
  >([]);

  return (
    <DbScaffold title="Single Gene Search" currentPage={MenuPages.searchGenes}>
      <DbContext.Consumer>
        {(db) => (
          <>
            <SearchGenes
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
                  const url = Routes.Gene(c.hgncId);
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
                    window.location.assign(
                      Routes.Gene(geneCandidates[0].hgncId)
                    )
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
  root.render(<InpGenesApp />);
}
