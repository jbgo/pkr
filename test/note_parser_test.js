import { strict as assert } from 'assert'
import { NoteParser } from '../lib/note_parser.js'

export class NoteParserTest {
  testEmpty() {
    const text = ''
    let tree = NoteParser.parse(text)
    assert.deepStrictEqual(tree, [':DOC'])
  }

  testSentence() {
    const text = 'This is a simple sentence.'
    let tree = NoteParser.parse(text)
    assert.deepStrictEqual(tree,
      [':DOC',
        [':P', 'This is a simple sentence.']])
  }

  testParagraphs() {
    const text =
`This is the first paragraph.

This is the second paragraph.`
    let tree = NoteParser.parse(text)
    assert.deepStrictEqual(tree,
      [':DOC',
        [':P', 'This is the first paragraph.'],
        [':P', 'This is the second paragraph.']])
  }

  testMultilineParagraph() {
    const text =
`
This is a paragraph that
spans multiple lines.
`
    let tree = NoteParser.parse(text)
    assert.deepStrictEqual(tree,
      [':DOC',
        [':P', 'This is a paragraph that spans multiple lines.']])
  }

  testH1() {
    const text = '# this is a heading'
    let tree = NoteParser.parse(text)
    assert.deepStrictEqual(tree,
      [':DOC',
        [':H1',
          [':TEXT', 'this is a heading']]])
  }
}