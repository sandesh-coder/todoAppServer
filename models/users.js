import mongoose from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const userSchema = new mongoose.Schema({
    name: {
        type:String,
        required : [true,"Name is required!"],
    },
    email: {
        type:String,
        required : [true,"email is required!"],
        unique: true,
    },
    password: {
        type:String,
        required: [true,"password is required!"],
        minlength: [8,"Password must be atleast 8 characters long"],
        select:false,
    },
    avatar: {
        public_id: String,
        url: String,
    },
    createdAt: {
        type:Date,
        default:Date.now,
    },
    tasks:[{
        title:"String",
        description:"String",
        completed:Boolean,
        createdAt:Date,
    }],

    verified:{
        type: Boolean,
        default: false,
    },
    
    otp: Number,
    otp_expiry: Date,
    resetPasswordOTP: Number,
    resetPasswordExpiry: Date,
});

userSchema.pre("save", async function (next){
    if (!this.isModified("password")) {
        return next();
    }
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(this.password, salt);
    this.password = hashedPassword;
    next();
})

userSchema.methods.getJWTToken = function () {
    return jwt.sign({_id:this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000,
    });
}

userSchema.methods.comparePassword = async function (pwd) {
   return await bcrypt.compare(pwd, this.password);
}

userSchema.index({otp_expiry:1},{expireAfterSeconds: 0})

export const User = mongoose.model("User",userSchema);