import path from 'path'
import { promises as fsPromises } from 'fs'

class TestReporter {
  constructor() {
    this.passed = []
    this.skipped = []
    this.failed = []
  }

  pass(testCase, testMethod) {
    this.passed.push({testCase: testCase, testMethod: testMethod})
  }

  skip(testCase, testMethod) {
    this.skipped.push({testCase: testCase, testMethod: testMethod})
  }

  fail(testCase, testMethod, err) {
    this.failed.push({testCase: testCase, testMethod: testMethod, err: err})
  }

  summarize() {
    let totalPassed = this.passed.length
    let totalFailed = this.failed.length
    let total = totalPassed + totalFailed

    console.log('\n---\n')
    this.passed.forEach((result) => console.log('PASS', result.testCase.name, result.testMethod))
    this.skipped.forEach((result) => console.log('SKIP', result.testCase.name, result.testMethod))
    this.failed.forEach((result) => {
      console.log('\nFAIL', result.testCase.name, result.testMethod)
      console.group()
      console.log(this.cleanStackTrace(result.err.stack))
      console.groupEnd()
    })
    console.log('\n---')
    console.log(`${total} Tests. ${totalPassed} Passed. ${totalFailed} Failed.`)

    if (totalFailed > 0) {
      process.exit(1)
    }
  }

  cleanStackTrace(stack) {
    let stackLines = stack.split('\n')
    let testStartIndex = stackLines.findIndex((line) => line.includes(process.cwd() + '/test.js:'))
    return stackLines.slice(0, testStartIndex).join('\n')
  }
}

let reporter = new TestReporter()

const reportPass = (testCase, testMethod) => {
  console.log('PASS', testCase.name, testMethod)
}

const reportFail = (testCase, testMethod, err) => {
  console.log('FAIL', testCase.name, testMethod)
  console.group()
  console.log(err.stack)
  console.groupEnd()
}

const filterTestFiles = (dirents) => {
  let testArgs = process.argv.slice(2)
  if (testArgs.length > 0) {
    return testArgs.map((fileName) => fileName.replace(/^\.?\/?test\//, ''))
  }

  return dirents
    .filter((dirent) => dirent.name.endsWith('_test.js'))
    .map((dirent) => dirent.name)
}

const loadTestCases = async () => {
  const dirents =
    await fsPromises
      .readdir('./test', { withFileTypes: true })

  const testFiles = filterTestFiles(dirents)

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
      let result = await test[testMethod]()
      if (typeof result === 'string' && result.toLowerCase().startsWith('skip')) {
        reporter.skip(testCase, testMethod)
      } else {
        reporter.pass(testCase, testMethod)
      }
    } catch(err) {
      reporter.fail(testCase, testMethod, err)
    } finally {
      try {
        if (test.teardown) await test.teardown()
        resolve()
      } catch(err) {
        reporter.fail(testCase, testMethod, err)
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
    reporter.fail(testCase, 'static setup', err)
  }

  await Promise.all(
    testMethods.map((testMethod) =>
      runTest(testCase, testMethod)))

  try {
    if (testCase.teardown) {
      await testCase.teardown()
    }
  } catch(err) {
    reporter.fail(testCase, 'static teardown', err)
  }
}

const runTestSuite = async () => {
  let testCases = await loadTestCases()
  await Promise.all(testCases.map(runTestCase))
  reporter.summarize()
}

runTestSuite()