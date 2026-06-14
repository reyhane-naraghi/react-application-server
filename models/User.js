// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    avatar: {
<<<<<<< HEAD
        type: String,
        default: "http://localhost:5000/profile.jpg"
=======
        type: String, // URL یا مسیر فایل تصویر پروفایل (مثلاً '/uploads/avatar-12345.jpg')
        default: "http://localhost:5000/profile.jpg" // تصویر پیش‌فرض
>>>>>>> a71a7a419fdb2a449216b16ffd806f7eb5e52ac8
    },
    bio: {
        type: String,
        trim: true,
        default: ''
    },
    occupation: {
        type: String,
        trim: true,
        default: ''
    },
    followers: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'user'
            }
        }
    ],
<<<<<<< HEAD
    seller: {
        type: Boolean,
        required: true,
        default: false,
    },
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Products",default : [] }],
=======
>>>>>>> a71a7a419fdb2a449216b16ffd806f7eb5e52ac8
    following: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'user'
            }
        }
    ],
    date: {
        type: Date,
        default: Date.now
<<<<<<< HEAD
    },
    phone: {
        type: String,
    },
    orders: {
        type: [{
            product: mongoose.Schema.Types.ObjectId,
            status: Number,
        }],
        ref: "Products",
        default : []
    }
});

// orders.status
// 0:
// ارسال درخواست به فروشنده
// 1: 
// تایید و ارسال مجصول توسط فروشنده
//  2:
// پرداخت و حذف از سفارشات


=======
    }
});

// هش کردن رمز عبور قبل از ذخیره
>>>>>>> a71a7a419fdb2a449216b16ffd806f7eb5e52ac8
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

<<<<<<< HEAD

=======
// متد برای مقایسه رمز عبور
>>>>>>> a71a7a419fdb2a449216b16ffd806f7eb5e52ac8
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('user', UserSchema);