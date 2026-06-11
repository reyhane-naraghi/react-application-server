const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const router = express.Router();

const website = "http://localhost:5173";
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Product = require('../models/Product');

const Zarinpal = require('zarinpal-node-sdk'); 
const zarinpal = new Zarinpal({
  merchantId: 'your-merchant-id',
  sandbox: true,
  accessToken: 'your-access-token',
});




const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);

    }
});


const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('فقط فایل‌های تصویری مجاز هستند!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 1024 * 1024 * 5
    }
});

router.post("/", auth, upload.single('image'), async (req, res) => {
    try {
        console.log(req.user);
        let user = await User.findById(req.user);
        const { title, description, price, amount } = req.body;
        let image;
        if (req.file) {
            image = `http://localhost:5000/uploads/${req.file.filename}`;
        }
        if (!image) {
            return res.status(401).send({
                data: null,
                message: "تصویر ضروری است",
                error: null
            })
        }
        const newProduct = new Product({ title, description, price, amount, image, seller: false, });
        const product = await newProduct.save();
        user.products.push(product._id);
        user = await user.save();
        res.status(201).send({
            data: {
                user,
                product,
            },
            message: "با موفقیت اضافه شد",
            error: null
        })
    } catch (error) {
        res.status(500).send({
            data: null,
            error: null,
            message: "خطای سمت سرور"
        })
    }
});

router.put("/:pro_id", auth, upload.single('image'), async (req, res) => {
    try {
        const { order, status } = req.query;
        const proId = req.params.pro_id;
        if (!proId) {
            return res.status(401).send({
                data: null,
                message: "no pro_id params",
                error: null
            })
        }
        if (order) {
            if (!status) {
                return res.status(401).send({
                    data: null,
                    message: "no status params,it must be 0/1/2",
                    error: null
                })
            }
            const userId = req.user;
            const user = await User.findById(userId);

            if (status == 0) {
              
                user.orders = [...user.orders,{
                    product: proId,
                    status: 0
                }]
                const updatedUser = await user.save();
                return res.send({
                    data: updatedUser,
                    message: "با موفقیت بروزرسانی شد",
                    error: null
                })
            }
            else if (status == 1) {
                user.orders.forEach((order)=>{
                    if (order.product == proId) order.status = 1;
                });
                const updatedUser = await user.save();
                return res.send({
                    data: updatedUser,
                    message: "با موفقیت بروزرسانی شد",
                    error: null
                })
            }
            else if (status == 2) {
                const product = await Product.findById(proId)
                const response = await zarinpal.payments.create({
                    amount:product.price,
                    description:product._id,
                    callback_url: website + "/",
                    email: user.email,
                });
            }

        }

        const { title, description, price, amount } = req.body;
        let image;
        if (req.file) {
            image = `http://localhost:5000/uploads/${req.file.filename}`;
        }
        if (!image) {
            return res.status(401).send({
                data: null,
                message: "تصویر ضروری است",
                error: null
            })
        }
        await Product.updateOne(
            { _id: proId },
            { $set: { title, description, price, amount, image } },
            { new: true }
        );
        const product = await Product.findById(proId);
        res.send({
            data: product,
            message: "با موفقیت بروزرسانی شد",
            error: null
        })
    } catch (error) {
        res.status(500).send({
            data: null,
            error: null,
            message: "خطای سمت سرور"
        })
    }
});

router.delete("/:pro_id", auth, async (req, res) => {
    try {
        const userId = req.user;
        const proId = req.params.pro_id;
        if (!proId) {
            return res.status(401).send({
                data: null,
                message: "no pro_id params",
                error: null
            })
        }
        const user = await User.findById(userId);
        if (req.query.order == 'true'){
            user.orders = user.orders.filter(order=>order.product != proId);
            const updatedUser = await user.save();
            return res.send({
                data: updatedUser,
                message: "با موفقیت حذف شد",
                error: null
            })
        }
        else {
            user.products = user.products.filter(product => product.toString() != proId);
            await user.save();
            await Product.findByIdAndDelete(proId);
            res.send({
                data: null,
                message: "با موفقیت حذف شد",
                error: null
            })
        }
    } catch (error) {
        res.status(500).send({
            data: null,
            error: null,
            message: "خطای سمت سرور"
        })
    }
});

router.get("/", async (req, res) => {
    try {
        const { userId, proId, order, sellerOrders } = req.query;
        
        if (sellerOrders == 'true' && userId) {
            console.log("Hello")
            const seller = await User.findById(userId).populate('products');
            if (!seller) {
                return res.status(404).send({
                    data: null,
                    message: "کاربر یافت نشد",
                    error: null
                });
            }
            const productIds = seller.products.map(p => p._id);
            const usersWithOrders = await User.find({
                'orders.product': { $in: productIds }
            }).populate('orders.product');
            
            let sellerOrdersList = [];
            usersWithOrders.forEach(user => {
                user.orders.forEach(order => {
                    if (productIds.some(id => {
                        console.log(id,order)
                        return id.equals(order.product._id)
                    })) {
                        sellerOrdersList.push({
                            buyer: { id: user._id, name: user.name, email: user.email },
                            order: order
                        });
                    }
                });
            });
            
            return res.send({
                data: sellerOrdersList,
                message: "لیست سفارشات محصولات فروشنده",
                error: null
            });
        }
        
        if (order == 'true' && userId) {
            const user = await User.findById(userId).populate('orders.product');
            if (!user) {
                return res.status(404).send({
                    data: null,
                    message: "کاربر یافت نشد",
                    error: null
                });
            }
            return res.send({
                data: user.orders,
                message: "لیست سفارشات کاربر",
                error: null
            });
        }

        if (userId) {
            const user = await User.findById(userId).populate('products');
            if (!user) {
                return res.status(404).send({
                    data: null,
                    message: "کاربر یافت نشد",
                    error: null
                });
            }
            return res.send({
                data: user.products,
                message: "لیست محصولات کاربر",
                error: null
            });
        }
        
        if (proId) {
            const product = await Product.findById(proId);
            if (!product) {
                return res.status(404).send({
                    data: null,
                    message: "محصول یافت نشد",
                    error: null
                });
            }
            return res.send({
                data: product,
                message: "محصول مورد نظر",
                error: null
            });
        }

        return res.status(400).send({
            data: null,
            message: "لطفاً userId یا proId یا order=true همراه با userId یا sellerOrders=true همراه با userId را وارد کنید",
            error: null
        });
    } catch(error) {
        console.log(error)
        res.status(500).send({
            data: null,
            error: null,
            message: "خطای سمت سرور"
        });
    }
});

module.exports = router