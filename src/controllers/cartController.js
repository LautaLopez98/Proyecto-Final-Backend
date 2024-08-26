import ProductManagerMONGO from "../dao/Mongo/productManagerMONGO.js";
import {isValidObjectId} from "mongoose";
import { cartService } from "../services/cartService.js";
import { productService } from "../services/productService.js";
import { ticketService } from "../services/ticketService.js";
import { CustomError  } from "../errors/customError.js";
import { TIPOS_ERROR } from "../errors/errors.js"
import { sendPurchaseEmail } from "../nodemailer.js";
import "express-async-errors"

const productManager = new ProductManagerMONGO();


export class CartController {
    static getCarts = async (req, res, next) => {
        try {
            const carts = await cartService.getCarts();
            req.logger.info('Carritos obtenidos correctamente:'); 
            res.json(carts);
        } catch (error) {
            req.logger.error(JSON.stringify({name: error.name, message: error.message, stack: error.stack,}, null, 4));
            return next(error);
        }
    }

    static getCartById = async (req, res, next) => {
        let {cid}=req.params
        if(!isValidObjectId(cid)){
            return next(CustomError.createError('Error', null, 'Ingrese un id válido de MongoDB como argumento para la búsqueda', TIPOS_ERROR.INVALID_ARGUMENT));
        }
        try {
            const cart = await cartService.getCartByPopulate({_id:cid});
            req.logger.info('Carrito obtenido correctamente:');
            res.json(cart);
        
        } catch (error) {
            req.logger.error(JSON.stringify({name: error.name, message: error.message, stack: error.stack,}, null, 4));
            return next(error);
        }
    }

    static createCart = async (req, res, next) => {
        try {
            const newCart = await cartService.createCart()
            req.logger.info('Carrito creado exitosamente');
            res.json({newCart});
        } catch (error) {
            req.logger.error(JSON.stringify({name: error.name, message: error.message, stack: error.stack,}, null, 4));
            return next(error);
        }
    }

    static addToCart = async(req, res, next)=>{
        let {cid, pid}=req.params
        if(!isValidObjectId(cid) || !isValidObjectId(pid)){
            return next(CustomError.createError('Error', null, 'Ingrese un id válido de MongoDB como argumento para búsqueda', TIPOS_ERROR.INVALID_ARGUMENT));
        }
        
        let carrito=await cartService.getCartById({_id:cid})
        if(!carrito){
            return next(CustomError.createError('CartNotFoundError', null, `Carrito con ID ${cid} no encontrado`, TIPOS_ERROR.CART_NOT_FOUND));
        }
    
        let producto=await productManager.getById({_id:pid})
        if(!producto){
            return next(CustomError.createError('ProductNotFoundError', null, `Producto con id ${pid} no encontrado`, TIPOS_ERROR.PRODUCT_NOT_FOUND));
        }
        if (req.user.rol === 'premium' && producto.owner.toString() === req.user.email.toString()) {
            return next(CustomError.createError('UnauthorizedError', null, 'No podés agregar tu propio producto al carrito', TIPOS_ERROR.UNAUTHORIZED));
        }
        if (producto.stock <= 0) {
            return res.status(400).json({ message: 'El producto no tiene stock disponible' });
        }
        let indiceProducto=carrito.products.findIndex(p=>p.product==pid)
        if(indiceProducto===-1){
            carrito.products.push({
                product: pid, quantity:1
            })
        }else{
            carrito.products[indiceProducto].quantity++
        }
    
        let resultado=await cartService.update(cid, carrito)
        if(resultado.modifiedCount>0){
            let carritoActualizado = await cartService.getCartByPopulate({_id: cid});
            res.setHeader('Content-Type','application/json');
            return res.status(200).json({payload:"Carrito actualizado", carrito: carritoActualizado });
        }else{
            req.logger.error(JSON.stringify({name: error.name, message: error.message, stack: error.stack,}, null, 4));
            return next(error);
        }
    }

    static deleteProductInCart = async (req, res, next) => {
        const { cid, pid } = req.params;
        if(!isValidObjectId(cid) || !isValidObjectId(pid)){
            return next(CustomError.createError('Error', null, 'Ingrese un id válido de MongoDB como argumento para búsqueda', TIPOS_ERROR.INVALID_ARGUMENT));
        }
        try {
            const result = await cartService.deleteProductInCart(cid, pid);
            res.json({ message: "Producto eliminado del carrito", result });
        } catch (error) {
            req.logger.error(JSON.stringify({name: error.name, message: error.message, stack: error.stack,}, null, 4));
            return next(error);
        }
    }

    static updateCart = async (req, res, next) => {
        const { cid } = req.params;
        const { products } = req.body;
        if(!isValidObjectId(cid)){
            return next(CustomError.createError('Error', null, 'Ingrese un id válido de MongoDB como argumento para búsqueda', TIPOS_ERROR.INVALID_ARGUMENT));
        }
        try {
            const result = await cartService.update(cid, { products });
            res.json({ message: "Carrito actualizado", result });
        } catch (error) {
            req.logger.error(JSON.stringify({name: error.name, message: error.message, stack: error.stack,}, null, 4));
            return next(error);
        }
    }

    static updateProductInCart = async (req, res, next) => {
        const { cid, pid } = req.params;
        const { quantity } = req.body;
        if(!isValidObjectId(cid) || !isValidObjectId(pid)){
            return next(CustomError.createError('Error', null, 'Ingrese un id válido de MongoDB como argumento para búsqueda', TIPOS_ERROR.INVALID_ARGUMENT));
        }
        try {
            const result = await cartService.updateProductQuantity(cid, pid, quantity);
            res.json({ message: "Cantidad de producto actualizada en el carrito", result });
        } catch (error) {
            req.logger.error(JSON.stringify({name: error.name, message: error.message, stack: error.stack,}, null, 4));
            return next(error);
        }
    }

    static deleteProducts = async (req, res, next) => {
        const { cid } = req.params;
        try {
            const result = await cartService.deleteProducts(cid);
            res.json({ message: "Todos los productos eliminados del carrito", result });
        } catch (error) {
            req.logger.error(JSON.stringify({name: error.name, message: error.message, stack: error.stack,}, null, 4));
            return next(error);
        }
    }

    static purchaseCart = async (req, res, next) => {
        const { cid } = req.params;

        if (!isValidObjectId(cid)) {
            return next(CustomError.createError('Error', null, 'Ingrese un id válido de MongoDB como argumento para búsqueda', TIPOS_ERROR.INVALID_ARGUMENT));
        }

        try {
            const cart = await cartService.getCartById({ _id: cid });
            if (!cart) {
                return next(CustomError.createError('CartNotFoundError', null, `Carrito con id ${cid} no encontrado`, TIPOS_ERROR.CART_NOT_FOUND));
            }

            const productsNotPurchased = [];
            const purchasedProducts = [];
            let totalAmount = 0;

            for (const cartProduct of cart.products) {
                const product = await productService.getProductBy({ _id: cartProduct.product });
                if (product.stock >= cartProduct.quantity) {
                    product.stock -= cartProduct.quantity;
                    await productService.updateProduct(product._id, { stock: product.stock });
                    purchasedProducts.push({
                        product: {
                            title: product.title,
                            price: product.price,
                            description: product.description,
                        },
                        quantity: cartProduct.quantity
                    });
                    totalAmount += product.price * cartProduct.quantity;
                } else {
                    productsNotPurchased.push(cartProduct.product);
                }
            }

            if (purchasedProducts.length > 0) {
                const ticket = await ticketService.createTicket({
                    amount: totalAmount,
                    purchaser: req.session.user.email,
                    products: purchasedProducts
                });

                cart.products = cart.products.filter(cartProduct => productsNotPurchased.includes(cartProduct.product));
                await cartService.update(cid, { products: cart.products });
                sendPurchaseEmail(ticket, req.session.user.email);
                req.logger.info('Correo de confirmación enviado.');
                return res.json({ message: 'Compra realizada con éxito', ticket, productsNotPurchased });
            } else {
                return next(CustomError.createError('Error', null, 'No se pudieron procesar los productos del carrito', TIPOS_ERROR.INVALID_ARGUMENT));
            }
        } catch (error) {
            req.logger.error(JSON.stringify({name: error.name, message: error.message, stack: error.stack,}, null, 4));
            return next(error);
        }
    };
}