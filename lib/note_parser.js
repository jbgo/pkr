const Labels = {
  BLANK: ':BLANK',
  DOC: ':DOC',
  H1: ':H1',
  NULL: ':NULL',
  P: ':P',
  TEXT: ':TEXT',
}

class Token {
  constructor(type = Labels.NULL, data = null) {
    this.type = type
    this.data = data
  }
}

class Node {
  constructor(name, data = null) {
    this.name = name
    this.data = data
    this._parent = this
    this._children = []
  }

  get parent() {
    return this._parent
  }

  set parent(node) {
    this._parent = node
  }

  get children() {
    return this._children
  }

  addChild(node) {
    node.parent = this
    this._children.push(node)
  }

  toArray() {
    let arr = [this.name]

    if (this.data) {
      arr.push(this.data)
    }

    this.children.forEach((child) =>
      arr.push(child.toArray()))

    return arr
  }
}

export class NoteParser {
  constructor(noteText) {
    this.tree = new Node(Labels.DOC)
    this.noteText = noteText
    this.noteLines = noteText.split('\n')
    this.tokens = []
  }

  collect() {
    this.noteLines.forEach((line) => {
      if (line.match(/^\s*$/)) {
        this.tokens.push(new Token(Labels.BLANK))
      } else if (line.startsWith('# ')) {
        let [_, text] = line.split('# ')
        this.tokens.push(new Token(Labels.H1, text))
      } else {
        this.tokens.push(new Token(Labels.TEXT, line))
      }
    })
  }

  reduce(tokens, lastToken = null, node = null) {
    let token = this.tokens.shift()
    if (!token) return // no more tokens
    if (!node) node = this.tree

    switch (token.type) {
      case Labels.BLANK:
        node = node.parent
        break
      case Labels.H1:
        let h1 = new Node(Labels.H1)
        let text = new Node(Labels.TEXT, token.data)
        h1.addChild(text)
        node.addChild(h1)
        break
      case Labels.TEXT:
        if (node.name == Labels.P) {
          node.data += ' ' + token.data
        } else {
          let child = new Node(Labels.P, token.data)
          node.addChild(child)
          node = child
        }
        break
    }

    this.reduce(tokens, token, node)
  }

  parse() {
    this.collect()
    console.log('TOKENS', this.tokens)
    this.reduce()
    console.log('TREE', this.tree.toArray())
  }

  toArray(node = null, repr = []) {
    return this.tree.toArray()
  }

  static parse(noteText) {
    console.log('--- BEGIN NOTE ---')
    console.log(noteText)
    console.log('--- END NOTE ---')
    let parser = new NoteParser(noteText)
    parser.parse()
    return parser.toArray()
  }
}