import { Console, timeStamp } from 'console'

const console = new Console({
  stdout: process.stdout,
  stderr: process.stderr,
  inspectOptions: {depth: 5}
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
  BOLD: ':BOLD',
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
    this._parent = (name === Nodes.NULL) ? this : new Node(Nodes.NULL)
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
    node._parent = this
    this._children.push(node)
  }

  addSibling(node) {
    this._parent.addChild(node)
  }

  get path() {
    let path = ''
    let node = this
    while (!node.is(Nodes.NULL)) {
      path = (path.length > 0) ? `${node.name}/${path}` : node.name
      node = node.parent
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

export class NoteParser {
  constructor(noteText, debug = false) {
    this.debug = debug
    this.root = new Node(Nodes.DOC)
    this.noteText = noteText
    this.remainingText = noteText
    this.tokens = new TokenList()
  }

  parse() {
    if (this.debug) { console.log('----- BEGIN PARSE -----') }

    let line
    let node = this.root

    while (line = this.nextLine()) {
      if (this.debug) { console.log(`  node=${node.path}\n    line="${line.trim()}"`) }

      if (line == '\n') {
        // break out of block
        while (!node.is(Nodes.DOC)) { node = node.parent }
        continue
      }

      if (line.startsWith('# ')) {
        let text = new Node(Nodes.TEXT, line.substr('# '.length))
        let h1 = new Node(Nodes.H1)
        h1.addChild(text)
        node.addChild(h1)
        node = text
        continue
      }

      if (line.startsWith('* ') || line.startsWith('- ')) {
        let text = new Node(Nodes.TEXT, line.substr('# '.length))
        let li = new Node(Nodes.LI)
        
        while (!(node.is(Nodes.UL) || node.is(Nodes.DOC))) {
          node = node.parent
        }


        if (node.is(Nodes.DOC)) {
          let ul = new Node(Nodes.UL)
          node.addChild(ul)
          node = ul
        }

        node.addChild(li)
        li.addChild(text)
        node = text
        continue
      }

      if (node.is(Nodes.DOC)) {
        let block = new Node(Nodes.BLOCK)
        node.addChild(block)
        node = block
      }

      let inlineNodes = this.parseText(line)
      if (node.is(Nodes.TEXT) && inlineNodes.length == 1 && inlineNodes[0].is(Nodes.TEXT)) {
        node.content = node.content.replace(/\n$/, '') + ' ' + line
      } else {
        inlineNodes.forEach((inlineNode) => node.addChild(inlineNode))
        node = lastOf(inlineNodes)
      }
    }

    if (this.debug) { console.log('----- END PARSE -----') }
    if (this.debug) { console.log(this.root.toArray()) }
  }

  parseText(text) {
    let matchLink = text.match(/\[([^\]]+)\]\(([^\)]+)\)/m)
    let matchBold = text.match(/\*\*(.*?)\*\*/m)
    if (!matchBold) { matchBold = text.match(/__(.*?)__/m) }

    if (matchLink) {
      let linkText = new Node(Nodes.TEXT, matchLink[1])
      let linkURL = matchLink[2]
      let beforeText = new Node(Nodes.TEXT, text.substr(0, matchLink.index))
      let afterText = new Node(Nodes.TEXT, text.substr(matchLink.index + matchLink[0].length))

      let link = new Node(Nodes.LINK)
      link.attributes.url = linkURL
      link.addChild(linkText)

      return [beforeText, link, afterText]
    } else if (matchBold) {
      let boldText = new Node(Nodes.BOLD, matchBold[1])
      let beforeText = new Node(Nodes.TEXT, text.substr(0, matchBold.index))
      let afterText = new Node(Nodes.TEXT, text.substr(matchBold.index + matchBold[0].length))
      let nodeList = []
      if (beforeText.content.length > 0) nodeList.push(beforeText)
      nodeList.push(boldText)
      if (afterText.content.length > 0) nodeList.push(afterText)
      return nodeList
    } else {
      return [new Node(Nodes.TEXT, text)]
    }
  }

  toArray(node = null, repr = []) {
    return this.root.toArray()
  }

  nextLine() {
    let line
    let newlineIndex = this.remainingText.indexOf('\n')

    if (newlineIndex > -1) {
      line = this.remainingText.substr(0, 1 + newlineIndex)
      this.remainingText = this.remainingText.substr(1 + newlineIndex)
    } else if (this.remainingText.length > 0) {
      line = this.remainingText
      this.remainingText = ''
    }

    return line
  }
}