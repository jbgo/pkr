export class Repository {
  constructor(options = {}) {
    this.debug = !!options.debug
    this.title = options.title
    this.rootPath = options.rootPath
  }
}