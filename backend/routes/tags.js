const express = require('express')
const tagController = require('../controllers/tagController')
const router = express.Router()
const auth = require('../middleware/auth')

router.use(auth)

router.post('/', tagController.createTag)
router.get('/', tagController.getTags)
router.put('/:id',tagController.updateTag)
router.delete('/:id',tagController.deleteTag)

module.exports = router