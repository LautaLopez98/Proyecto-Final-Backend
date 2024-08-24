import { isValidObjectId } from 'mongoose';
import { usersModel } from '../dao/models/usersModel.js';
import { CustomError } from '../errors/customError.js';
import { TIPOS_ERROR } from '../errors/errors.js';
import 'express-async-errors';

export class UserController {
    static changeUserRole = async (req, res, next) => {
        let { uid } = req.params;
        if (!isValidObjectId(uid)) {
            return next(CustomError.createError('Error', null, 'Ingrese un id válido de MongoDB como argumento para búsqueda', TIPOS_ERROR.INVALID_ARGUMENT));
        }
    
        try {
            const user = await usersModel.findById(uid);
            if (!user) {
                return next(CustomError.createError('UserNotFoundError', null, `Usuario con id ${uid} no encontrado`, TIPOS_ERROR.USER_NOT_FOUND));
            }
            const uploadedDocumentsCount = user.documents.filter(doc => doc.reference.includes('\\uploads\\documents\\')).length;
            if (user.rol === 'user') {
                if (uploadedDocumentsCount >= 3) {
                    user.rol = 'premium';
                    await user.save();
                    req.logger.info('Rol de usuario cambiado a premium correctamente');
                    res.json({ message: 'Rol de usuario cambiado a premium correctamente', user });
                } else {
                    req.logger.error('El usuario no ha cargado suficientes documentos para cambiar a premium');
                    return res.status(400).json({ message: 'Debe cargar al menos 3 documentos para cambiar a premium' });
                }
            } else if (user.rol === 'premium') {
                user.rol = 'user';
                await user.save();
                req.logger.info('Rol de usuario cambiado a user correctamente');
                res.json({ message: 'Rol de usuario cambiado a user correctamente', user });
            } else {
                return next(CustomError.createError('Error', null, 'No se puede cambiar el rol de administrador', TIPOS_ERROR.DATA_TYPE));
            }
        } catch (error) {
            req.logger.error(`Error al cambiar el rol del usuario con id ${uid}`, error);
            return next(error);
        }
    }
    
    
    static uploadDocuments = async (req, res, next) => {
        let { uid } = req.params;
        if (!isValidObjectId(uid)) {
            return next(CustomError.createError('Error', null, 'Ingrese un id válido de MongoDB como argumento para búsqueda', TIPOS_ERROR.INVALID_ARGUMENT));
        }
    
        try {
            const user = await usersModel.findById(uid);
            if (!user) {
                return next(CustomError.createError('UserNotFoundError', null, `Usuario con id ${uid} no encontrado`, TIPOS_ERROR.USER_NOT_FOUND));
            }
    
            const files = req.files;
            if (!files || (!files['documents'] && !files['profile'] && !files['product'])) {
                return res.status(400).json({ message: "No se han subido archivos" });
            }
    
            const documents = [];
            if (files['documents']) {
                files['documents'].forEach(file => {
                    documents.push({
                        name: file.originalname,
                        reference: file.path
                    });
                });
            }
    
            if (files['profile']) {
                files['profile'].forEach(file => {
                    documents.push({
                        name: file.originalname,
                        reference: file.path
                    });
                });
            }
    
            if (files['product']) {
                files['product'].forEach(file => {
                    documents.push({
                        name: file.originalname,
                        reference: file.path
                    });
                });
            }
    
            user.documents.push(...documents);
            await user.save();
    
            res.json({ message: "Documentos subidos correctamente", documents: user.documents });
        } catch (error) {
            req.logger.error(`Error al subir documentos del usuario con id ${uid}`, error);
            return next(error);
        }
    }
    
}