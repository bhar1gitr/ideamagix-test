const USER_ROLES = {
    SUPER_ADMIN: 'super-admin',
    SUB_ADMIN: 'sub-admin',
    SUPPORT_AGENT: 'support-agent'
}

module.exports = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({message:"forbidden"})
        }
        next()
    }
}