export class UrlParam {
  urlParams: URLSearchParams | undefined;

  constructor() {
    this.urlParams = new URL(document.location.href).searchParams;
  }

  get(name: string): string | undefined {
    if (!this.urlParams) {
      return undefined;
    }
    const par = this.urlParams.get(name);
    if (par === null) {
      return undefined;
    }
    return decodeURIComponent(par);
  }
}
