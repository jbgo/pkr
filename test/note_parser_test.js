import { strict as assert } from 'assert'
import { NoteParser } from '../lib/note_parser.js'

export class NoteParserTest {
  testH1() {
    const txt = '# this is a heading'
    const expected = ['doc' ['h1', ['text', 'this is a heading']]]
    assert.ok(false, 'TODO')
  }
}