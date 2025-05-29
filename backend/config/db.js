const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.DB_CONNECTION_CRED);
        console.log('DB connection successfull');
    } catch(error) {
        console.log(error.message);
        process.exit(1)
    }
}

module.exports = connectDB