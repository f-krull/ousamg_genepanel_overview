import React = require("react");

export function Description({
  title,
  children,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="col-sm-5 col-md-2 text-muted text-sm-end text-start">
        {title}:
      </div>
      <div className="col-sm-7 col-md-4">{children}</div>
    </>
  );
}
