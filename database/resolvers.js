import mongoose from 'mongoose';
import { Clientes, Productos, Pedidos, Usuarios } from './db';
import bcrypt from 'bcrypt';

// Acá es generado el token de acceso
import dotenv from 'dotenv';
dotenv.config({
    path: "variables.env"
});

import jwt from 'jsonwebtoken';
const crearToken = (elUsuario, secreto, expira) => {
    const { usuario } = elUsuario;

    return jwt.sign({usuario}, secreto, {
        expiresIn: expira
    });
}

const ObjectId = mongoose.Types.ObjectId;

export const resolvers = {
    Query: {
        getClientes: (root, { limite, offset, vendedor }) => {
            let filtro;

            if (vendedor) {
                filtro = {
                    vendedor: new ObjectId(vendedor)
                }
            }

            return Clientes.find(filtro).limit(limite).skip(offset);
        },
        getCliente: (root, { id }) => {
            return new Promise((resolve, object) => {
                Clientes.findById(id, (error, cliente) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(cliente);
                    }
                });
            });
        },
        totalClientes: (root, { vendedor }) => {
            let filtro;

            if (vendedor) {
                filtro = {
                    vendedor: new ObjectId(vendedor)
                }
            }

            return new Promise((resolve, object) =>{
                Clientes.countDocuments(filtro, (error, count) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(count);
                    }
                })
            });
        },
        getProductos: (root, { limite, offset, hideSoldOut }) => {
            let filtro;

            if (hideSoldOut) {
                filtro = {
                    stock: {
                        $gt: 0
                    }
                }
            }

            return Productos.find(filtro).limit(limite).skip(offset);
        },
        getProducto: (root, { id }) => {
            return new Promise((resolve, object) => {
                Productos.findById(id, (error, producto) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(producto);
                    }
                });
            });
        },
        totalProductos: (root) => {
            return new Promise((resolve, object) =>{
                Productos.countDocuments({}, (error, count) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(count);
                    }
                })
            });
        },
        getPedidos: (root, { cliente }) => {
            return new Promise((resolve, object) => {
                Pedidos.find({
                    cliente: cliente
                }, (error, pedido) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(pedido);
                    }
                })
            })
        },
        topClientes: (root) => {
            return new Promise((resolve, object) => {
                Pedidos.aggregate([
                    {
                        $match: {
                            estado: "COMPLETADO"
                        }
                    },
                    {
                        $group: {
                            _id: "$cliente",
                            total: {
                                $sum: "$total"
                            }
                        }
                    },
                    {
                        $lookup: {
                            from: "clientes",
                            localField: "_id",
                            foreignField: "_id",
                            as: "cliente"
                        }
                    },
                    {
                        $sort: {
                            total: -1
                        }
                    },
                    {
                        $limit: 10
                    }
                ], (error, response) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(response);
                    }
                })
            })
        },
        topVendedores: (root) => {
            return new Promise((resolve, object) => {
                Pedidos.aggregate([
                    {
                        $match: {
                            estado: "COMPLETADO"
                        }
                    },
                    {
                        $group: {
                            _id: "$vendedor",
                            total: {
                                $sum: "$total"
                            }
                        }
                    },
                    {
                        $lookup: {
                            from: "usuarios",
                            localField: "_id",
                            foreignField: "_id",
                            as: "vendedor"
                        }
                    },
                    {
                        $sort: {
                            total: -1
                        }
                    },
                    {
                        $limit: 10
                    }
                ], (error, response) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(response);
                    }
                })
            })
        },
        getUsuario: (root, args, { usuarioActual }) => {
            if (!usuarioActual) {
                return null;
            }
            
            // Obtengo el usuario actual (usuarioActual) del objetito que obtengo con el sign(), el de user, iat, exp...
            const usuario = Usuarios.findOne({usuario: usuarioActual.usuario})

            return usuario;
        }
    },
    Mutation: {
        crearCliente: (root, { formulario }) => {
            const nuevoCliente = new Clientes({
                nombre: formulario.nombre,
                apellido: formulario.apellido,
                empresa: formulario.empresa,
                emails: formulario.emails,
                edad: formulario.edad,
                tipo: formulario.tipo,
                pedidos: formulario.pedidos,
                vendedor: formulario.vendedor
            });
            // MongoDB crea un ID automático que es _id
            nuevoCliente.id = nuevoCliente._id;

            return new Promise((resolve, object) => {
                nuevoCliente.save((error) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(nuevoCliente);
                    }
                });
            });
        },
        actualizarCliente: (root, { formulario }) => {
            return new Promise((resolve, object) => {
                Clientes.findOneAndUpdate({_id: formulario.id}, formulario, {new: true}, (error, cliente) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(cliente);
                    }
                });
            });
        },
        eliminarCliente: (root, { id }) => {
            return new Promise((resolve, object) => {
                Clientes.findOneAndDelete({_id: id}, (error) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve("Eliminado perfekto.");
                    }
                });
            });
        },
        crearProducto: (root, { formulario }) => {
            const nuevoProducto = new Productos({
                nombre: formulario.nombre,
                precio: formulario.precio,
                stock: formulario.stock
            });

            // MongoDB crea un ID automático que es _id
            nuevoProducto.id = nuevoProducto._id;

            return new Promise((resolve, object) => {
                nuevoProducto.save((error) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(nuevoProducto);
                    }
                });
            });
        },
        actualizarProducto: (root, { formulario }) => {
            return new Promise((resolve, object) => {
                Productos.findOneAndUpdate({_id: formulario.id}, formulario, {new: true}, (error, producto) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(producto);
                    }
                });
            });
        },
        eliminarProducto: (root, { id }) => {
            return new Promise((resolve, object) => {
                Productos.findOneAndDelete({_id: id}, (error) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve("Eliminado perfekto.");
                    }
                });
            });
        },
        crearPedido: (root, { formulario }) => {
            const nuevoPedido = new Pedidos({
                pedido: formulario.pedido,
                total: formulario.total,
                fecha: new Date(),
                cliente: formulario.cliente,
                estado: "PENDIENTE",
                vendedor: formulario.vendedor
            });
            // MongoDB crea un ID automático que es _id
            nuevoPedido.id = nuevoPedido._id

            return new Promise((resolve, object) => {
                // Acá bajamos el stock de productos pedidos
                formulario.pedido.forEach(pedido => {
                    Productos.updateOne({_id: pedido.id}, {
                        "$inc": {
                            "stock": `-${pedido.cantidad}`
                        }
                    }, (error) => {
                        if (error) {
                            return new Error(error);
                        }
                    })
                });

                nuevoPedido.save((error) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(nuevoPedido);
                    }
                });
            });
        },
        actualizarPedido: (root, { formulario, estadoAnterior }) => {
            return new Promise((resolve, object) => {
                // Acá bajamos el stock de productos pedidos si fue completado o lo restauramos si fue cancelado
                const { estado } = formulario;
                const instruccion = (estado === "COMPLETADO") ? (
                    (estadoAnterior === "PENDIENTE" ? "0*" : "-")
                ) : ((estado === "CANCELADO") ? (
                    "+"
                ) : ( // estado === "PENDIENTE"
                    (estadoAnterior === "COMPLETADO" ? "0*" : "-")
                ))

                formulario.pedido.forEach(pedido => {
                    Productos.updateOne({_id: pedido.id}, {
                        "$inc": {
                            "stock": `${instruccion}${pedido.cantidad}`
                        }
                    }, (error) => {
                        if (error) {
                            return new Error(error);
                        }
                    })
                });

                Pedidos.findOneAndUpdate({_id: formulario.id}, formulario, {new: true}, (error) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve("El pedido fue actualizado correctamente.");
                    }
                })
            });
        },
        crearUsuario: async (root, { usuario, nombre, password, rol }) => {
            const existeUsuario = await Usuarios.findOne({usuario});

            if (existeUsuario) {
                throw new Error("El usuario ya existe");
            } else {
                const nuevoUsuario = await new Usuarios({
                    usuario,
                    nombre,
                    password,
                    rol
                });
    
                nuevoUsuario.save();

                return "Usuario creado PERFEKTAMENTE";
            }
        },
        autenticarUsuario: async (root, { usuario, password }) => {
            const elUsuario = await Usuarios.findOne({usuario});
            
            if (!elUsuario) {
                throw new Error("Ese usuario no existe");
            }

            const passwordCorrecta = await bcrypt.compare(password, elUsuario.password);

            if (!passwordCorrecta) {
                throw new Error("Password incorrecta");
            }
            return {
                token: crearToken(elUsuario, process.env.SECRETO, "1hr")
            }
        }
    }
}

export default resolvers;