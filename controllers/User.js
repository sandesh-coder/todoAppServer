import { User } from "../models/users.js";
import { sendMail } from "../utils/sendMail.js";
import { sendToken } from "../utils/sendToken.js";
import cloudinary from "cloudinary";
import fs from "fs"


export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const avatar = req.files.avatar.tempFilePath;
        console.log(avatar);

        

        let user = await User.findOne({ email });

        if (user) {
            return res.status(400).json({
                success: false,
                message: `${email} is already exist!`,
            });
        }

        const otp = Math.floor(Math.random() * 1000000);

        const mycloud = cloudinary.v2.uploader.upload(avatar, {
            folder: "todoApp",
        });

        console.log((await mycloud).public_id);
        console.log((await mycloud).secure_url);


        fs.rmSync("./tmp",{ recursive: true });

        user = await User.create({
            name,
            email,
            password,
            avatar: {
                public_id: (await mycloud).public_id,
                url: (await mycloud).secure_url,
            },
            otp,
            otp_expiry: new Date(Date.now() + process.env.OTP_EXPIRED * 60 * 1000),
        });

        await sendMail(email, "Verify your account", `Your OTP is ${otp}`);

        sendToken(res, user, 201, "OTP sent to your email, please verify your account");
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

export const verify = async (req, res) => {
    try {


        const otp = Number(req.body.otp);

        const user = await User.findById(req.user._id);

        if (user.otp !== otp || user.otp_expiry < Date.now()) {
            return res
                .status(400)
                .json({ success: false, message: "Invalid OTP or has been Expired" });
        }

        user.verified = true;
        user.otp = null;
        user.otp_expiry = null;

        await user.save();

        sendToken(res, user, 200, "Account Verified");
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res
                .status(400)
                .json({ success: false, message: "Please enter all fields" });
        }

        const user = await User.findOne({ email }).select("+password");

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid Email or Password",
            });
        }

        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Invalid Email or Password",
            });
        }

        sendToken(res, user, 200, "Login Successful");

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

export const logout = async (req, res) => {
    try {
        res.status(200).cookie("token", null, {
            expires: new Date(Date.now()),
        }).json({ success: true, message: "Logged out successfully" });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const addtask = async (req, res) => {
    try {
        const { title, description } = req.body;

        const user = await User.findById(req.user._id);

        user.tasks.push({
            title,
            description,
            completed: false,
            createdAt: new Date(Date.now())
        });

        await user.save();

        res.status(200).json({ success: true, message: "Task added successfully" });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const removeTask = async (req, res) => {
    try {
        const { taskId } = req.params;

        const user = await User.findById(req.user._id);

        user.tasks = user.tasks.filter(task => task._id.toString() !== taskId.toString());
        console.log(user.tasks);
        await user.save();

        res.status(200).json({ success: true, message: "Task removed successfully" });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const updateTask = async (req, res) => {
    try {
        const { taskId } = req.params;

        const user = await User.findById(req.user._id);

        user.task = user.tasks.find(
            (task) => task._id.toString() === taskId.toString());

        console.log(user.task.completed);

        user.task.completed = !user.task.completed;

        await user.save();

        res.status(200).json({ success: true, message: "Task updated successfully" });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const getMyProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        sendToken(
            res,
            user,
            201,
            `welcome back ${user.name}`,
        );
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        const { name } = req.body;
        const avatar = req.files.avatar.tempFilePath;
        console.log(avatar);
        if (name) {
            user.name = name;
        }

        if (avatar) {
            await cloudinary.v2.uploader.destroy(user.avatar.public_id);

            const mycloud = await cloudinary.v2.uploader.upload(avatar,{
                folder: "todoApp",
            });

            fs.rmSync("./tmp",{ recursive: true });

            user.avatar = {
                public_id: mycloud.public_id,
                url: mycloud.secure_url,
            }
        }
        await user.save();
        res
            .status(200)
            .json({ success: true, message: "Profile Updated successfully" });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const updatePassword = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("password");

        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res
                .status(400)
                .json({ success: false, message: "Please enter all fields" });
        }

        const isMatch = await user.comparePassword(oldPassword);

        if (!isMatch) {
            return res
                .status(400)
                .json({
                    success: false,
                    message: "Invalid old Password",
                });
        }

        user.password = newPassword;

        await user.save();

        res
            .status(200)
            .json({ success: true, message: "Password Updated successfully" });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const forgetPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res
                .status(400)
                .json({ success: false, message: "Please enter all fields" });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res
                .status(400)
                .json({ success: false, message: "email id not exist" });
        }

        const otp = Math.floor(Math.random() * 1000000);

        user.resetPasswordOTP = otp;
        user.resetPasswordExpiry = Date.now() + 10 * 60 * 1000;

        await user.save();

        const message = `Your OTP for resetting the password ${otp}.\n If you did not request for this, please ignore this email.`

        await sendMail(email, "Request For resetting Password", `${message}`);

        res
            .status(200)
            .json({ success: true, message: `OTP sent to ${email}` });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { otp, newPassword } = req.body;

        if (!otp || !newPassword) {
            return res
                .status(400)
                .json({ success: false, message: "Please enter all fields" });
        }

        const user = await User.findOne({
            resetPasswordOTP: otp,
            resetPasswordExpiry: { $gt: Date.now() }
        }).select("+password");

        if (!user) {
            return res
                .status(400)
                .json({ success: false, message: "OTP Invalid or has been Expired" });
        };

        user.password = newPassword;

        user.resetPasswordOTP = null;
        user.resetPasswordExpiry = null;

        await user.save();

        res
            .status(200)
            .json({ success: true, message: "Password changed successfully" });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};