const express = require('express');
const app = express();

require('dotenv').config();
const db = require('./config/database');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const {cloudinaryConnect} = require('./config/cloudinary');
const fileUpload = require('express-fileupload');

const PORT = process.env.PORT || 4000;

// connect db
db.connect();

// middlewares
app.use(express.json());
app.use(cookieParser());
app.use(
    cors({
        origin:"http://localhost:3000",
        credientials: true,
    })
);
app.use(
    fileUpload({
        useTempFiles: true,
        tempFileDir:"/tmp",
    })
);

// connect cloudinary
cloudinaryConnect();

const userRoutes = require('./routes/User');
const profileRoutes = require('./routes/Profile');
const paymentRoutes = require('./routes/Payments');
const courseRoutes = require('./routes/Course');

// test route
app.get('/', (req, res) => {
    return res.json({
        success: true,
        message: 'welcome to studyNotion backend....'
    })
})

// routes
app.use("/api/v1/auth", userRoutes);
app.use("/api/v1/profile", profileRoutes);
app.use("/api/v1/course", courseRoutes);
app.use("/api/v1/payment", paymentRoutes);

app.listen(PORT, () => {
    console.log(`server running at ${process.env.API_URL}${PORT}`);
})