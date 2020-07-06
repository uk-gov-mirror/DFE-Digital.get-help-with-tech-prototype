function originalQuery (req) {
  var originalQueryString = req.originalUrl.split('?')[1]
  return originalQueryString ? `?${originalQueryString}` : ''
}

function nextAndBackPaths (paths, req) {
  const currentPath = req.path
  const query = originalQuery(req)
  const data = req.session.data
  const index = paths.indexOf(currentPath)
  const next = paths[index + 1] || ''
  let back = paths[index - 1] || ''

  // Point back to where we forked from
  if (currentPath === data['forked-to']) {
    back = data['forked-from']
  }

  // Remove the saved fork if we return to it
  if (currentPath === data['forked-from'] && req.method === 'GET') {
    delete data['forked-from']
    delete data['forked-to']
  }

  return {
    next: next + query,
    back: back + query,
    current: currentPath + query
  }
}

function nextForkPath (forks, req) {
  const currentPath = req.path
  const data = req.session.data
  const fork = forks[currentPath]

  if (fork) {
    for (const [key, condition] of Object.entries(fork)) {
      const values = Array.isArray(condition.values) ? condition.values : [condition.values]

      if (values.includes(data[key])) {
        data['forked-from'] = currentPath
        data['forked-to'] = condition.path

        return condition.path
      }
    }
  }

  return false
}

function schoolWizardPaths (req) {
  var paths = [
    '/family',
    '/family/who',
    '/family/ready',
    '/family/eligible',
    '/family/ready-device',
    '/family/connect-bt',
    '/family/connect-bt-elsewhere',
    '/family/send-login',
    '/family/login-sent',
    '/family/login-to-bt',
    '/family/confirm-access',
    '/family/success',
    '/family'
  ]

  return nextAndBackPaths(paths, req)
}

function schoolWizardForks (req) {
  var forks = {
    '/family/eligible': {
      eligible: {
        values: [
          'Yes'
        ],
        path: '/family/not-eligible'
      }
    },
    '/family/connect-bt-elsewhere': {
      'connect-bt-elsewhere': {
        values: [
          'No, there was no BT wifi network available',
          'Yes, but this location isn’t suitable for working',
          'No, they can’t move their device (eg desktop computer)',
          'No, they could see a BT wifi network but couldn’t connect',
          'No, there was no BT wifi network available'
        ],
        path: '/family/mno/no-bt'
      }
    },
    '/family/login-to-bt': {
      'login-to-bt': {
        values: [
          'No'
        ],
        path: '/family/mno/no-bt'
      }
    },
    '/family/confirm-access': {
      'confirm-access': {
        values: [
          'No'
        ],
        path: '/family/mno/no-bt'
      }
    },
    '/family/connect-bt': {
      'connect-bt': {
        values: [
          'Yes, they have connected to the network'
        ],
        path: '/family/send-login'
      }
    }
  }

  return nextForkPath(forks, req)
}

function schoolMnoWizardPaths (req) {
  var paths = [
    '/family/mno/no-bt',
    '/family/mno/network',
    '/family/mno/payg',
    '/family/mno/network-offer',
    '/family/mno/number',
    '/family/mno/account-holder-name',
    '/family/mno/privacy',
    '/family/mno/success',
    '/family'
  ]

  return nextAndBackPaths(paths, req)
}

module.exports = {
  schoolWizardPaths,
  schoolWizardForks,
  schoolMnoWizardPaths
}