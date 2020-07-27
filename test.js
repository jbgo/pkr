import path from 'path'
import { promises as fsPromises } from 'fs'
import { ServerTest } from './test/server_test.js'

const loadTestCases = async () => {
  const dirents =
    await fsPromises
      .readdir('./test', { withFileTypes: true })

  const testFiles =
    dirents
      .filter((dirent) => dirent.name.endsWith('_test.js'))
      .map((dirent) => dirent.name)

  const imports =
    testFiles
      .map((fname) => import(path.join(process.cwd(), 'test', fname)))

  const testModules = await Promise.all(imports)

  return testModules
    .flatMap((mod) => Object.keys(mod))
    .filter((key) => key.endsWith('Test'))
    .map((className) => eval(className))
}

const runTest = async (testCase, testMethod) => {
  let test = new testCase

  try {
    await test.setup()
    await test[testMethod]()
    console.log('PASS', testCase.name, testMethod)
  } catch(err) {
    console.log('FAIL', testCase.name, testMethod)
    console.group()
    console.log(err.stack)
    console.groupEnd()
  } finally {
    await test.teardown()
  }

}

const runTestCase = async (testCase) => {
  let testMethods =
    Object
      .getOwnPropertyNames(testCase.prototype)
      .filter((prop) => prop.startsWith('test'))

  testMethods.forEach((testMethod) => runTest(testCase, testMethod))
}

const runTestSuite = async () => {
  let testCases = await loadTestCases()
  testCases.forEach(runTestCase)
}

runTestSuite()