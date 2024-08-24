import {Router} from "express";
export const router = Router();
import passport from "passport";
import { passportCall } from "../middlewares/passportCall.js";
import { UsersDTO } from "../dto/usersDto.js";
import { usersModel } from "../dao/models/usersModel.js";

router.get("/error", (req, res)=>{
    res.setHeader('Content-Type','application/json');
    return res.status(500).json(
        {
            error:`Error inesperado en el servidor - Intente más tarde, o contacte a su administrador`,
        }
    )
})

router.post('/registro', passportCall("registro", "registro"), async (req, res) => {
    if (req.user) {
        if (req.body.redirect === 'true') {
            return res.redirect('/login');
        }
        return res.status(200).json({ message: "Registro exitoso", user: req.user });
    }
    const errorMessage = 'El correo ya está registrado';
    if (req.body.redirect === 'true') {
        return res.redirect(`/registro?error=${encodeURIComponent(errorMessage)}`);
    }
    return res.status(400).json({ error: errorMessage });
});

router.post('/login', passportCall("login", "login"), async (req, res) => {
    if (req.user) {
        let user = { ...req.user };
        delete user.password;
        req.session.user = user;

        if (req.body.redirect === 'true') {
            return res.redirect('/products');
        }
        return res.status(200).json({ message: "Login exitoso", user });
    }
});


router.get("/github", passport.authenticate("github", {}), (req, res)=>{
    if (req.body.redirect === 'true') {
        return res.redirect('/login');
    }
})

router.get("/cbGitHub", passport.authenticate("github", {failureRedirect:"/api/sessions/error"}), (req, res)=>{
    req.session.user=req.user
    if (req.session.user) {
        return res.redirect('/products');
    }
    res.setHeader('Content-Type','application/json');
    return res.status(200).json({payload:"Usuario logueado", user:req.user});
})

router.get("/logout", async (req, res) => {
    try {
        if (req.session.user) {
            let user = await usersModel.findById({ _id: req.session.user._id });
            user.last_connection = new Date();
            await user.save();
        }
        req.session.destroy(err => {
            if (err) {
                res.setHeader('Content-Type', 'application/json');
                return res.status(500).json({
                    error: 'Error inesperado en el servidor. Intenta más tarde, o contacta a tu administrador',
                    detalle: `${err.message}`
                });
            }
            return res.redirect('/');
        });
    } catch (error) {
        res.setHeader('Content-Type', 'application/json');
        return res.status(500).json({
            error: 'Error inesperado en el servidor. Intenta más tarde, o contacta a tu administrador',
            detalle: `${error.message}`
        });
    }
});


router.get("/current", (req, res) => {
    if (!req.session.user) {
        res.redirect('/login')
    }
    const userDTO = new UsersDTO(req.session.user);
    return res.send(userDTO);
});