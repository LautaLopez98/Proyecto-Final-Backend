import { Router } from "express";
import { UserController } from "../controllers/userController.js";
import { upload } from "../utils.js";
import { auth } from "../middlewares/auth.js";
import { usersModel } from "../dao/models/usersModel.js";

export const router = Router();

router.post("/premium/:uid", UserController.changeUserRole);
router.post("/:uid/documents", upload.fields([{ name: 'documents', maxCount: 10 },{ name: 'profile', maxCount: 10 },{ name: 'product', maxCount: 10 }]), UserController.uploadDocuments);
router.get('/', UserController.getUsers);
router.put('/:email/rol', auth(["admin"]), async (req, res) => {
    const { email } = req.params;
    const { rol } = req.body;
    try {
        const updatedUser = await usersModel.findOneAndUpdate(
            { email: email },
            { $set: { rol: rol } }, 
            { new: true } 
        );

        if (!updatedUser) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        console.log('Usuario actualizado:', updatedUser); // Para verificar en el servidor
        res.json({ message: 'Rol actualizado correctamente', user: updatedUser });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar el rol del usuario' });
    }
});



router.delete('/:email', auth(["admin"]), async (req, res) => {
    const { email } = req.params;
    try {
        const result = await usersModel.deleteOne({ email: email });
        
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json({ message: 'Usuario eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar el usuario' });
    }
});
