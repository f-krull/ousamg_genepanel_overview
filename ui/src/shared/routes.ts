export namespace Routes {
  export const Home = "./index.html";
  const _Gene = "./gene.html";
  const _Genepanel = "./genepanel.html";

  export const Gene = (id: string) =>
    `${_Gene}?hgncId=${encodeURIComponent(id)}`;

  export const Genepanel = (genepanelName: string, genepanelVersion: string) =>
    `${_Genepanel}?name=${encodeURIComponent(
      genepanelName
    )}&version=${encodeURIComponent(genepanelVersion)}`;
}
