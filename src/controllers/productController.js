import {isValidObjectId} from "mongoose";
import {io} from "../app.js"
import { productService } from "../repository/productService.js";
import { CustomError  } from "../errors/customError.js";
import { TIPOS_ERROR } from "../errors/errors.js"
import "express-async-errors"

export class ProductController {
    static getProducts = async (req, res, next) => {
        try {
            const { page = 1, limit = 10, sort, category, stock } = req.query;
            const pageNumber = parseInt(page) || 1;
            const query = { category, stock };
            const products = await productService.getProducts(parseInt(limit), pageNumber, sort, query);
            req.logger.info('Productos obtenidos correctamente');
            res.json(products);
        } catch (error) {
            req.logger.error(JSON.stringify({name: error.name, message: error.message, stack: error.stack,}, null, 4));
            return next(error);
        }
    }

    static getProductById = async (req, res, next)=> {
        let {pid}=req.params
        if(!isValidObjectId(pid)){
            return next(CustomError.createError('Error', null, 'Ingrese un id válido de MongoDB como argumento para búsqueda', TIPOS_ERROR.INVALID_ARGUMENT));
        }
        try {
            let product = await productService.getProductBy({_id:pid});
            if (!product) {
                return next(CustomError.createError('ProductNotFoundError', null, `Producto con id ${pid} no encontrado`, TIPOS_ERROR.PRODUCT_NOT_FOUND));
            }
            req.logger.info('Producto obtenido correctamente');
            res.json(product);
        } catch (error) {
            req.logger.error(JSON.stringify({name: error.name, message: error.message, stack: error.stack,}, null, 4));
            return next(error);
        }
    }

    static addProduct = async (req, res, next)=> {
        try {
            let {title, description, price, code, stock, category, status} = req.body;
            let thumbnail=undefined
            if(req.file){
                thumbnail=req.file.filename
            }
            if(!title || !description || !price || !code || !stock || !category){
                return next(CustomError.createError('InvalidArgumentError', null, 'Faltan datos: title, description, price, code, stock, category son obligatorios', TIPOS_ERROR.INVALID_ARGUMENT));
            }
            let owner = "admin";
            if (req.session.user.rol === "premium") {
                owner = req.session.user.email;
            }
            const product = await productService.addProduct({title, description, price, thumbnail, code, stock, category, status, owner})
            req.logger.info('Producto creado exitosamente');
            res.json(product)
        } catch (error) {
            req.logger.error(JSON.stringify({name: error.name, message: error.message, stack: error.stack,}, null, 4));
            return next(error);
        }
    }

    static updateProduct = async (req, res, next) => {
        let { pid } = req.params;
        if (!isValidObjectId(pid)) {
            return next(CustomError.createError('Error', null, 'Ingrese un id válido de MongoDB como argumento para búsqueda', TIPOS_ERROR.INVALID_ARGUMENT));
        }
        try {
            const updatedProduct = await productService.updateProduct({ _id: pid }, req.body);
            if (!updatedProduct) {
                req.logger.error(`No se encontró ningún producto con el ID ${pid} para actualizar.`);
                return next(CustomError.createError('ProductUpdateError', null, `No se pudo actualizar el producto con ID ${pid}`, TIPOS_ERROR.PRODUCT_UPDATE_FAILED));
            }
            req.logger.info('Producto actualizado exitosamente');
            res.json(updatedProduct);
        } catch (error) {
            req.logger.error(JSON.stringify({ name: error.name, message: error.message, stack: error.stack }, null, 4));
            return next(error);
        }
    }
    
    

    static deleteProduct = async (req, res, next) => {
        let { pid } = req.params;
        if (!isValidObjectId(pid)) {
            return next(CustomError.createError('Error', null, 'Ingrese un id válido de MongoDB como argumento para búsqueda', TIPOS_ERROR.INVALID_ARGUMENT));
        }
        try {
            let products = await productService.deleteProduct(pid);
            if (products.deletedCount > 0) {
            let productList = await productService.getProducts();
            io.emit("deleteProducts", productList);
            req.logger.info(`Producto con ${pid} eliminado exitosamente`);
            return res.status(200).json({payload:"Producto eliminado exitosamente", productList });
        } else {
            return next(CustomError.createError('ProductNotFoundError', null, `El producto con id ${pid} no existe`, TIPOS_ERROR.PRODUCT_NOT_FOUND));
        }
        } catch (error) {
            req.logger.error(JSON.stringify({name: error.name, message: error.message, stack: error.stack,}, null, 4));
            return next(error);
        }
    }
}