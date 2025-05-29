const express = require('express')
const leadController = require('../controllers/leadControllers')
const router = express.Router()
const auth = require('../middleware/auth')

router.use(auth)

router.post('/', leadController.createLead)
router.get('/', leadController.getLeads)
router.put('/:id',leadController.updateLead)
router.delete('/:id',leadController.deleteLead)

module.exports = router