const execa = require('execa')
const getPort = require('get-port')

const { sign } = require('@octokit/webhooks')
const bodyParser = require('body-parser')
const fastify = require('fastify')
const got = require('got')

/**
 * In these tests we are starting probot apps by running "npm run [path to app.js]" using ghub.io/execa.
 * This allows us to pass dynamic environment variables for configuration.
 *
 * We also spawn a mock server which receives the Octokit requests = require( the app and uses jest assertion)
 * to verify they are what we expect
 */

replIt()

async function createPorts () {
  const server = await getPort()
  const probot = await getPort()
  return [server, probot]
}

async function replIt () {
  const app = fastify()
  const [mockServerPort, probotPort] = await createPorts()
  console.log(mockServerPort)
  console.log(probotPort)

  // tslint:disable-next-line
  app.post('/api/v3', (req, res) => {
    res.status(201).json({
      token: 'v1.1f699f1069f60xxx',
      permissions: {
        issues: 'write',
        contents: 'read'
      },
      repository_selection: 'all'
    })
  })

  const probotProcess = execa(
    'bin/probot.js',
    ['run', './test/e2e/hello-world.js'],
    {
      env: {
        APP_ID: '1',
        PRIVATE_KEY:
            '-----BEGIN RSA PRIVATE KEY-----\nMIIBOQIBAAJBAIILhiN9IFpaE0pUXsesuuoaj6eeDiAqCiE49WB1tMB8ZMhC37kY\nFl52NUYbUxb7JEf6pH5H9vqw1Wp69u78XeUCAwEAAQJAb88urnaXiXdmnIK71tuo\n/TyHBKt9I6Rhfzz0o9Gv7coL7a537FVDvV5UCARXHJMF41tKwj+zlt9EEUw7a1HY\nwQIhAL4F/VHWSPHeTgXYf4EaX2OlpSOk/n7lsFtL/6bWRzRVAiEArzJs2vopJitv\nA1yBjz3q2nX+zthk+GLXrJQkYOnIk1ECIHfeFV8TWm5gej1LxZquBTA5pINoqDVq\nNKZSuZEHqGEFAiB6EDrxkovq8SYGhIQsJeqkTMO8n94xhMRZlFmIQDokEQIgAq5U\nr1UQNnUExRh7ZT0kFbMfO9jKYZVlQdCL9Dn93vo=\n-----END RSA PRIVATE KEY-----',
        WEBHOOK_SECRET: 'test',
        PORT: String(probotPort),
        GHE_HOST: `127.0.0.1:${mockServerPort}`,
        GHE_PROTOCOL: 'http',
        DISABLE_WEBHOOK_EVENT_CHECK: 'true',
        LOG_LEVEL: 'debug'
      }
    }
  ).stdout.pipe(process.stdout);

  // give probot a moment to start
  await new Promise((resolve) => setTimeout(resolve, 3000))

  // send webhook event request
  const body = JSON.stringify({
    action: 'opened',
    issue: {
      number: '1'
    },
    repository: {
      owner: {
        login: 'octocat'
      },
      name: 'hello-world'
    },
    installation: {
      id: 1
    }
  })

  try {
    const res = await got.post(`http://127.0.0.1:${probotPort}`, {
      headers: {
        'content-type': 'application/json',
        'x-github-event': 'issues',
        'x-github-delivery': '1',
        'x-hub-signature': sign('test', body)
      },
      body
    })
    console.log("POST BODY", res.body)
  } catch (error) {
    probotProcess.cancel()
    console.log((await probotProcess).stdout)
  }
}
