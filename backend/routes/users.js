const express = require('express')
const userController = require('../controllers/userController')
const router = express.Router()
const role = require('../middleware/role')
const auth = require('../middleware/auth')

router.use(auth)
router.use(role(['super-admin']));

router.post('/', userController.createUser)
router.get('/', userController.getUsers)
router.put('/:id', userController.updateUser)
router.delete('/:id', userController.deleteUser)

module.exports = router