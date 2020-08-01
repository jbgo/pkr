import { Console } from 'console'

const console = new Console({
  stdout: process.stdout,
  stderr: process.stderr,
  inspectOptions: {depth: 3}
})

const Tokens = {
  NEWLINE: ':\\n',
  NULL: ':NULL',
  POUND: ':#',
  STAR: ':*',
  TEXT: ':TEXT',
  LBRAC: ':[',
  RBRAC: ':]',
  LPAREN: ':(',
  RPAREN: ':)',
  DASH: ':-',
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
  NULL: ':NULL',
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
    return {type: this.type, text: this.text, previous: this.previous.type}
   }

  toString() {
    let text = this.is(Tokens.NEWLINE) ? '\\n' : this.text
    return `| ${this.type}\t|\t${text}`
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
    return this._tokens.map((t) => t.Object())
  }
}

class Node {
  constructor(name, content = null) {
    this._name = name
    this._content = content
    this._attributes = {}
    if (name != Nodes.NULL) { this._parent = new Node(Nodes.NULL) }
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

  get path() {
    let path = this.name
    let node = this
    while (!(node.is(Nodes.NULL) || node.parent.is(Nodes.NULL))) {
      node = node.parent
      path = node.name + '/' + path
    }
    return path
  }

  toArray(detail = true) {
    let arr = detail ? [this.name] : [this.path]

    if (this.content) {
      arr.push(this.content)
    }

    if (Object.keys(this.attributes).length > 0) {
      arr.push(this.attributes)
    }

    if (detail) {
      this.children.forEach((child) =>
        arr.push(child.toArray()))
    }

    return arr
  }

  asObject() {
    return {name: this.name, content: this.content, parent: this.parent.name}
  }
}

const mapToken = (tokenType) => {
  return (lastToken, nextChar) => {
    if (lastToken && lastToken.is(tokenType)) {
      lastToken.text += nextChar
      return // append to previous token
    }
    // create new token
    return new Token(tokenType, nextChar)
  }
}

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
COLLECTORS['['] = mapToken(Tokens.LBRAC)
COLLECTORS[']'] = mapToken(Tokens.RBRAC)
COLLECTORS['('] = mapToken(Tokens.LPAREN)
COLLECTORS[')'] = mapToken(Tokens.RPAREN)
COLLECTORS['-'] = mapToken(Tokens.DASH)

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

  if (node.is(Nodes.LINK)) {
    if (token.previous.is(Tokens.LBRAC)) {
      
    }

    if (token.previous.is(Tokens.LPAREN)) {
      node.attributes.url = token.text
      return node
    }
  }

  let text = new Node(Nodes.TEXT, token.text.trim())
  node.addChild(text)

  return text
}

REDUCERS[Tokens.NEWLINE] = (node, token) => {
  // multiple newlines, break out of current block
  if (token.text.length > 1) {
    while (!node.is(Nodes.DOC)) {
      node = node.parent
    }
    return node
  }

  // convert single newlines to spaces
  if (node.is(Nodes.TEXT) && token.next.is(Tokens.TEXT)) {
    node.content += ' '
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
  node.addChild(ul)
  return li
}

REDUCERS[Tokens.DASH] = (node, token) => {
  return REDUCERS[Tokens.STAR](node, token)
}

REDUCERS[Tokens.LBRAC] = (node, token) => {
  let link = new Node(Nodes.LINK)
  node.addSibling(link)
  return link
}

REDUCERS[Tokens.RBRAC] = (node, token) => {
  return node.parent
}

REDUCERS[Tokens.LPAREN] = (node, token) => {
  return node
}

REDUCERS[Tokens.RPAREN] = (node, token) => {
  return node.parent
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
      (node ) -> ${!node ? null : JSON.stringify(node.toArray(false))}
      (token) -> ${!token ? null : JSON.stringify(token.asObject())}`)
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
      this.tokens._tokens.forEach((token) => {
        let text = token.is(Tokens.NEWLINE) ? '\\n' : token.text
        console.log(`   (token) -> (type) -> ${token.type}\t(text) -> ${text} `)
      })
    }

    if (this.debug) { console.log('----- Reducers -----') }
    this.reduce()

    if (this.debug) {
      console.log('\n----- Nodes  -----')
      console.log(this.tree.toArray())
    }
  }

  toArray(node = null, repr = []) {
    return this.tree.toArray()
  }
}