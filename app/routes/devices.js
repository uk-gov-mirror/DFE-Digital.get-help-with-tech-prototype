const getKeypath = require('keypather/get')
const devicesPath = '/responsible-body/devices'

/**
 * Guide routes
 */
module.exports = router => {
  router.all([devicesPath, `${devicesPath}*`], function (req, res, next) {
    const data = req.session.data
    res.locals.hasDevolvedAll = data['who-orders-laptops'] === 'schools'
    res.locals.hasCentralAll = data['who-orders-laptops'] === 'central'
    res.locals.whoOrders = res.locals.hasDevolvedAll ? 'School' : 'Local authority'
    next()
  })

  router.all([`${devicesPath}/schools/:urn`, `${devicesPath}/schools/:urn/*`], function (req, res, next) {
    const urn = parseInt(req.params.urn, 10)
    const data = req.session.data
    const school = data.schools.find(school => school.URN === urn)
    const schoolData = getKeypath(req.session.data, `['responsible-body'][${req.params.urn}]`) || {}

    res.locals.school = school
    res.locals.schoolData = schoolData
    res.locals.urn = urn
    next()
  })

  router.post(`${devicesPath}/devolve`, function (req, res) {
    res.redirect(`${devicesPath}/next`)
  })

  router.all(`${devicesPath}/schools/:urn`, function (req, res) {
    const school = res.locals.school
    const schoolData = res.locals.schoolData

    const hasSetContactDetails = !!schoolData['person-type']
    const isHeadteacher = schoolData['person-type'] === 'headteacher'
    const emailAddress = isHeadteacher ? school.headteacher_email : schoolData['new-invite-email-address']
    const name = isHeadteacher ? school.headteacher : schoolData['new-invite-name']
    const number = isHeadteacher ? false : schoolData['new-invite-number']

    const hasSetChromebookDetails = !!schoolData.chromebooks
    const recoveryAddress = schoolData.chromebooks === 'Yes' ? schoolData.recovery : false
    const domain = schoolData.chromebooks === 'Yes' ? schoolData.domain : false

    let whoOrders = res.locals.hasCentralAll ? 'The local authority orders devices' : 'The school orders devices'
    if (schoolData.who) {
      whoOrders = schoolData.who === 'central' ? 'The local authority orders devices' : 'The school orders devices'
    }

    let success = false
    if (req.method === 'POST') {
      success = 'Saved'
      if (getKeypath(req.body, `['responsible-body'][${req.params.urn}]['person-type']`)) {
        success = `Saved. We’ve emailed ${emailAddress}`
      }
    }

    const showChromebookForm = !hasSetChromebookDetails && whoOrders === 'The local authority orders devices'
    const showContactForm = !hasSetContactDetails && whoOrders === 'The school orders devices'

    res.render('responsible-body/devices/school/index', {
      hasSetChromebookDetails,
      hasSetContactDetails,
      showChromebookForm,
      showContactForm,
      isHeadteacher,
      emailAddress,
      whoOrders,
      name,
      number,
      recoveryAddress,
      domain,
      success
    })
  })

  router.post(`${devicesPath}/schools/:urn/who`, function (req, res) {
    if (res.locals.schoolData.who === 'school') {
      res.redirect(`${devicesPath}/schools/${req.params.urn}/who-contact`)
    } else {
      res.redirect(`${devicesPath}/schools/${req.params.urn}/chromebooks`)
    }
  })

  router.all(`${devicesPath}/schools/:urn/:view`, function (req, res) {
    res.render(`responsible-body/devices/school/${req.params.view}`)
  })
}
