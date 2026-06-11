const mongoose = require('mongoose');
require('dotenv').config(); // برای لود کردن متغیرهای محیطی

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
        });
        console.log('MongoDB Connected...');
    } catch (err) {
        console.error(`could not connect the data base :  ${err.message}`);
        process.exit(1); // خروج از برنامه در صورت عدم موفقیت اتصال
    }
};

module.exports = connectDB;