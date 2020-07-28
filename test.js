import path from 'path'
import { promises as fsPromises } from 'fs'

const reportPass = (testCase, testMethod) => {
  console.log('PASS', testCase.name, testMethod)
}

const reportFail = (testCase, testMethod, err) => {
  console.log('FAIL', testCase.name, testMethod)
  console.group()
  console.log(err.stack)
  console.groupEnd()
}

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

  return testModules.flatMap((mod) => 
    Object
      .keys(mod)
      .filter((key) => key.endsWith('Test'))
      .map((className) => mod[className]))
}

const runTest = async (testCase, testMethod) => {
  let test = new testCase

  return new Promise(async (resolve, reject) => {
    try {
      if (test.setup) await test.setup()
      await test[testMethod]()
      reportPass(testCase, testMethod)
    } catch(err) {
      reportFail(testCase, testMethod, err)
    } finally {
      try {
        if (test.teardown) await test.teardown()
        resolve()
      } catch(err) {
        reject(err)
      }
    }
  })
}

const runTestCase = async (testCase) => {
  let testMethods =
    Object
      .getOwnPropertyNames(testCase.prototype)
      .filter((prop) => prop.startsWith('test'))

  try {
    if (testCase.setup) {
      await testCase.setup()
    }
  } catch(err) {
    reportFail(testCase, 'static setup', err)
  }

  await Promise.all(
    testMethods.map((testMethod) =>
      runTest(testCase, testMethod)))

  try {
    if (testCase.teardown) {
      await testCase.teardown()
    }
  } catch(err) {
    reportFail(testCase, 'static teardown', err)
  }
}

const runTestSuite = async () => {
  let testCases = await loadTestCases()
  testCases.forEach(runTestCase)
}

runTestSuite()