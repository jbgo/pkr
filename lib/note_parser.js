const Tokens = {
  NEWLINE: ':NEWLINE',
  NULL: ':NULL',
  POUND: ':#',
  STAR: ':*',
  TEXT: ':TEXT',
}

const ReverseTokens =
  Object.fromEntries(
    Object.entries(Tokens).map(([k, v]) => [v, k]))

const Nodes = {
  DOC: ':DOC',
  H1: ':H1',
  LI: ':LI',
  LINK: ':LINK',
  BLOCK: ':BLOCK',
  TEXT: ':TEXT',
  UL: ':UL',
}

const lastOf = (arr) =>
  arr[arr.length - 1]

class Token {
  constructor(type, text = '') {
    if (!ReverseTokens[type]) {
      throw new Error(`unrecognized token type '${type}'`)
    }

    this.type = type
    this.text = text

    if (type != ':NULL') {
      this.previous = new Token(Tokens.NULL)
      this.next = new Token(Tokens.NULL)
    }
  }

  is(tokenType) {
    return this.type === tokenType
  }

  asObject() {
    return {type: this.type, text: this.text, next: this.next.type, previous: this.previous.type}
  }
}

class TokenList {
  constructor() {
    this._tokens = []
  }

  get tokens() {}

  push(token) {
    let lastToken = lastOf(this._tokens)
    if (lastToken) {
      lastToken.next = token
      token.previous = lastToken
    }
    this._tokens.push(token)
  }

  shift() {
    return this._tokens.shift()
  }

  last() {
    return lastOf(this._tokens)
  }

  toArray() {
    return this._tokens.map((t) => t.asObject())
  }
}

class Node {
  constructor(name, content = null) {
    this._name = name
    this._content = content
    this._attributes
    this._parent = this
    this._children = []
  }

  get name() { return this._name }
  get content() { return this._content }
  get attributes() { return this._attributes }
  get parent() { return this._parent }
  get children() { return this._children }

  set content(newContent) { this._content = newContent }
  set parent(node) { this._parent = node }

  is(nodeName) {
    return this.name === nodeName
  }

  addChild(node) {
    node.parent = this
    this._children.push(node)
  }

  addSibling(node) {
    this.parent.addChild(node)
  }

  toArray() {
    let arr = [this.name]

    if (this.content) {
      arr.push(this.content)
    }

    this.children.forEach((child) =>
      arr.push(child.toArray()))

    return arr
  }

  asObject() {
    return {name: this.name, content: this.content, parent: this.parent.name}
  }
}

const mapToken = (tokenType) => (
  (lastToken, nextChar) => new Token(tokenType, nextChar))

const COLLECTORS = {}

COLLECTORS[':DEFAULT'] = (lastToken, nextChar) => {
  switch (lastToken.type) {
    case Tokens.TEXT:
      lastToken.text += nextChar
      return
    default:
      return new Token(Tokens.TEXT, nextChar)
  }
}

COLLECTORS['\n'] = mapToken(Tokens.NEWLINE)
COLLECTORS['#'] = mapToken(Tokens.POUND)
COLLECTORS['*'] = mapToken(Tokens.STAR)

const REDUCERS = {}

REDUCERS[Tokens.TEXT] = (node, token) => {
  if (token.text.length === 0) {
    return node
  }

  if (node.is(Nodes.TEXT)) {
    node.content += token.text
    return node
  }

  if (node.is(Nodes.DOC)) {
    let block = new Node(Nodes.BLOCK)
    node.addChild(block)
    node = block
  }

  let text = new Node(Nodes.TEXT, token.text.trim())
  node.addChild(text)

  return text
}

REDUCERS[Tokens.NEWLINE] = (node, token) => {
  if (node.is(Nodes.TEXT)) {
    // line separation, convert newline to space
    if (token.previous.is(Tokens.TEXT) && token.next.is(Tokens.TEXT)) {
      node.content += ' '
      return node
    }

    // multiple newlines, break out of block
    else if (token.previous.is(Tokens.NEWLINE)) {
      return node.parent.parent
    }

    // do nothing, might be more text coming
    else if (token.previous.is(Tokens.TEXT)) {
      return node
    }

    // single newline, break out of text node
    else {
      return node.parent
    }
  }

  return node
}

REDUCERS[Tokens.POUND] = (node, token) => {
  let h1 = new Node(Nodes.H1)
  node.addChild(h1)
  return h1
}

REDUCERS[Tokens.STAR] = (node, token) => {
  let li = new Node(Nodes.LI)

  if (node.parent.is(Nodes.LI)) {
    node.parent.addSibling(li)
    return li
  }

  let ul = new Node(Nodes.UL)
  ul.addChild(li)
  node.parent.addChild(ul)
  return li
}

export class NoteParser {
  constructor(noteText, debug = false) {
    this.debug = debug
    this.tree = new Node(Nodes.DOC)
    this.noteText = noteText
    this.tokens = new TokenList()
  }

  collect() {
    this.tokens.push(new Token(Tokens.TEXT))
    
    for (let char of this.noteText) {
      let collector = COLLECTORS[char]
      if (!collector) { collector = COLLECTORS[':DEFAULT'] }

      // A collector can either return a new token, or append to the previous token
      let newToken = collector(this.tokens.last(), char)
      if (newToken) { this.tokens.push(newToken) }
    }
  }

  reduce(lastToken = null, node = null) {
    let token = this.tokens.shift()
    node = node || this.tree

    if (this.debug) {
      console.log(
`  (reduce) ->
      (node ) -> ${!node ? null : JSON.stringify(node.toArray())}
      (token) -> ${!token ? null : JSON.stringify(token.asObject())}`
      )
    }

    if (!token) return // no more tokens

    let reducer = REDUCERS[token.type]
    if (!reducer) { throw new Error(`no reducer for token of type '${token.type}'`) }
    let nextNode = reducer(node, token)

    this.reduce(token, nextNode)
  }

  parse() {
    this.collect()
    if (this.debug) {
      console.log('----- Tokens -----')
      console.log(this.tokens.toArray())
    }
    this.reduce()
    if (this.debug) {
      console.log('----- Nodes  -----')
      console.log(this.tree.toArray())
    }
  }

  toArray(node = null, repr = []) {
    return this.tree.toArray()
  }
}