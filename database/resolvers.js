import {Clientes, Productos, Pedidos} from './db';

export const resolvers = {
    Query: {
        getClientes: (root, {limite, offset}) => {
            return Clientes.find({}).limit(limite).skip(offset);
        },
        getCliente: (root, {id}) => {
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
        totalClientes: (root) => {
            return new Promise((resolve, object) =>{
                Clientes.countDocuments({}, (error, count) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(count);
                    }
                })
            });
        },
        getProductos: (root, {limite, offset, hideSoldOut}) => {
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
        getProducto: (root, {id}) => {
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
        getPedidos: (root, {cliente}) => {
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
        }
    },
    Mutation: {
        crearCliente: (root, {formulario}) => {
            const nuevoCliente = new Clientes({
                nombre: formulario.nombre,
                apellido: formulario.apellido,
                empresa: formulario.empresa,
                emails: formulario.emails,
                edad: formulario.edad,
                tipo: formulario.tipo,
                pedidos: formulario.pedidos
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
        actualizarCliente: (root, {formulario}) => {
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
        eliminarCliente: (root, {id}) => {
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
        crearProducto: (root, {formulario}) => {
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
        actualizarProducto: (root, {formulario}) => {
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
        eliminarProducto: (root, {id}) => {
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
        crearPedido: (root, {formulario}) => {
            const nuevoPedido = new Pedidos({
                pedido: formulario.pedido,
                total: formulario.total,
                fecha: new Date(),
                cliente: formulario.cliente,
                estado: "PENDIENTE"
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
        actualizarPedido: (root, {formulario, estadoAnterior}) => {
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
        }
    }
}

export default resolvers;