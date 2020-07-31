import { strict as assert } from 'assert'
import { NoteParser } from '../lib/note_parser.js'

export class NoteParserTest {
  parseNote(text, debug = false) {
    let parser = new NoteParser(text, debug)
    parser.parse()
    return parser
  }

  testEmpty() {
    let parser = this.parseNote('')
    assert.deepStrictEqual(parser.tree.toArray(), [':DOC'])
  }

  testSentence() {
    let parser = this.parseNote('This is a simple sentence.')
    assert.deepStrictEqual(parser.tree.toArray(),
      [':DOC',
        [':BLOCK',
          [':TEXT', 'This is a simple sentence.']]])
  }

  testParagraphs() {
    let parser = this.parseNote(
`This is the first paragraph.

This is the second paragraph.`)
    assert.deepStrictEqual(parser.tree.toArray(),
      [':DOC',
        [':BLOCK',
          [':TEXT', 'This is the first paragraph.']],
        [':BLOCK',
          [':TEXT', 'This is the second paragraph.']]])
  }

  testMultilineParagraph() {
    let parser = this.parseNote(
`
This is a paragraph that
spans multiple lines.
`)
    assert.deepStrictEqual(parser.tree.toArray(),
      [':DOC',
        [':BLOCK',
          [':TEXT', 'This is a paragraph that spans multiple lines.']]])
  }

  testH1() {
    let parser = this.parseNote('# this is a heading')
    assert.deepStrictEqual(parser.tree.toArray(),
      [':DOC',
        [':H1',
          [':TEXT', 'this is a heading']]])
  }

  testUL() {
    let parser = this.parseNote(
`
* backpack
* sleeping bag
* socks
* head lamp
`)
    assert.deepStrictEqual(parser.tree.toArray(),
      [':DOC',
        [':UL',
          [':LI', [':TEXT', 'backpack']],
          [':LI', [':TEXT', 'sleeping bag']],
          [':LI', [':TEXT', 'socks']],
          [':LI', [':TEXT', 'head lamp']]]])
  }

  testHyperlink() {
    return 'skip'
    const text =
`
This code is [hosted on GitHub](https://github.com/jbgo/pkr).
`
    let tree = NoteParser.parse(text)
    assert.deepStrictEqual(tree,
      [':DOC',
        [':P',
          [':TEXT', 'This code is'],
          [':LINK',
            {'url': 'https://github.com/jbgo/pkr'},
            [':TEXT', 'hosted on GitHub']],
          [':TEXT', '.']]])
  }
}