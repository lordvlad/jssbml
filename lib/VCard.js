const assign = Object.assign
const xmlns = 'http://www.w3.org/2001/vcard-rdf/3.0#'

class VCardBase {
  get xmlns () { return xmlns }
  get xmlnsPrefix () { return 'vcard' }
}

class VCard extends VCardBase {}
class N extends VCardBase { }
class Org extends VCardBase { }
class Email extends VCardBase { }
class Family extends VCardBase { }
class Given extends VCardBase { }
class OrgName extends VCardBase { }

module.exports = assign(VCard, {
  xmlns,
  VCard,
  Family,
  Given,
  OrgName,
  N,
  Org,
  Email
})
