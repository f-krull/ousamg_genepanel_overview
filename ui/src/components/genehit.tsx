import React = require("react");

export function GeneHit({
  children,
  error,
}: {
  children: React.ReactNode;
  error: boolean;
}) {
  return (
    <div className="col-12">
      <span className={`badge rounded-pill bg-${error ? "danger" : "success"}`}>
        {children}
      </span>
    </div>
  );
}
