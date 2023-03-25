import express from "express";
import { addtask, forgetPassword, getMyProfile, login, logout, register, removeTask, resetPassword, updatePassword, updateProfile, updateTask, verify } from "../controllers/User.js";
import { isAuthenticated } from "../middleware/auth.js";

const router = express.Router();

router.route("/register").post(register);
router.route("/verify").post(isAuthenticated,verify);
router.route("/login").post(login);
router.route("/logout").get(logout);
router.route("/newTask").post(isAuthenticated,addtask);
router.route("/task/:taskId")
.delete(isAuthenticated,removeTask)
.put(isAuthenticated,updateTask);

router.route("/me").get(isAuthenticated,getMyProfile);
router.route("/updateProfile").put(isAuthenticated,updateProfile);
router.route("/updatePassword").put(isAuthenticated,updatePassword);
router.route("/forgetPassword").post(forgetPassword);
router.route("/resetPassword").put(resetPassword); // 1:34:46

export default router;