import { strict as assert } from 'assert'
import { NoteParser } from '../lib/note_parser.js'

export class NoteParserTest {

  assertParse(noteText, expectedTree, debug = false) {
    let parser = new NoteParser(noteText, debug)
    parser.parse()
    assert.deepStrictEqual(parser.toArray(), expectedTree)
  }

  testEmpty() {
    let text = ''

    let expected = [':DOC']

    this.assertParse(text, expected)
  }

  testSentence() {
    let text = 'This is a simple sentence.'

    let expected =
      [':DOC',
        [':BLOCK',
          [':TEXT', 'This is a simple sentence.']]]

    this.assertParse(text, expected)
  }

  testParagraphs() {
    let text =
`This is the first paragraph.

This is the second paragraph.`

    let expected =
      [':DOC',
        [':BLOCK',
          [':TEXT', 'This is the first paragraph.\n']],
        [':BLOCK',
          [':TEXT', 'This is the second paragraph.']]]

    this.assertParse(text, expected)
  }

  testMultilineParagraph() {
    let text =
`
This is a paragraph that
spans multiple lines.
`

    let expected =
      [':DOC',
        [':BLOCK',
          [':TEXT', 'This is a paragraph that spans multiple lines.\n']]]

    this.assertParse(text, expected)
  }

  testH1() {
    let text = '# this is a heading'

    let expected =
      [':DOC',
        [':H1',
          [':TEXT', 'this is a heading']]]

    this.assertParse(text, expected)
  }

  testUL() {
    let text =
`
* backpack
* sleeping bag
* socks
* head lamp

- this is also
- an un-ordered list
- and 2 * 2 = 4
`

    let expected =
      [':DOC',
        [':UL',
          [':LI', [':TEXT', 'backpack\n']],
          [':LI', [':TEXT', 'sleeping bag\n']],
          [':LI', [':TEXT', 'socks\n']],
          [':LI', [':TEXT', 'head lamp\n']]],
        [':UL',
          [':LI', [':TEXT', 'this is also\n']],
          [':LI', [':TEXT', 'an un-ordered list\n']],
          [':LI', [':TEXT', 'and 2 * 2 = 4\n']]]]

    this.assertParse(text, expected)
  }

  testHyperlink() {
    let text =
`
This code is [hosted on GitHub](https://github.com/jbgo/pkr).
`

    let expected =
      [':DOC',
        [':BLOCK',
          [':TEXT', 'This code is '],
          [':LINK',
            {'url': 'https://github.com/jbgo/pkr'},
            [':TEXT', 'hosted on GitHub']],
          [':TEXT', '.\n']]]

    this.assertParse(text, expected)
  }

  testBold() {
    let text =
`Hello. __This text is bold.__ However, __this text is not.

**This text is also bold**. But then again, **this text is not.`

    let expected =
      [':DOC',
        [':BLOCK',
          [':TEXT', 'Hello. '],
          [':BOLD', 'This text is bold.'],
          [':TEXT', ' However, __this text is not.\n']],
        [':BLOCK',
          [':BOLD', 'This text is also bold'],
          [':TEXT', '. But then again, **this text is not.']]]

    this.assertParse(text, expected)
  }

}