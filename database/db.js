import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcrypt';

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/clientes', {
    useNewUrlParser: true
});
mongoose.set("setFindAndModify", false);

// Definimos el schema de Clientes
const clientesSchema = new Schema({
    nombre: String,
    apellido: String,
    empresa: String,
    emails: Array,
    edad: Number,
    tipo: String,
    pedidos: Array,
    vendedor: mongoose.Types.ObjectId 
});
const Clientes = mongoose.model('clientes', clientesSchema);

// Definimos el schema de Productos
const productosSchema = new Schema({
    nombre: String,
    precio: Number,
    stock: Number
});
const Productos = mongoose.model('productos', productosSchema);

// Definimos el schema de Pedidos
const pedidosSchema = new Schema({
    pedido: Array,
    total: Number,
    fecha: Date,
    cliente: mongoose.Types.ObjectId,
    estado: String,
    vendedor: mongoose.Types.ObjectId
});
const Pedidos = mongoose.model('pedidos', pedidosSchema);

// Definimos el schema de Usuarios
const usuariosSchema = new Schema({
    usuario: String,
    nombre: String,
    password: String,
    rol: String
});
// Hash de password antes de guardar (.pre('save') sirve para ejecutar algo antes de que sea guardado en la base de datos)
usuariosSchema.pre('save', function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    bcrypt.genSalt(10, (error, salt) => {
        if (error) {
            return next(error);
        }
        bcrypt.hash(this.password, salt, (error, hash) => {
            if (error) {
                return next(error);
            }
            this.password = hash;
            next();
        })
    })
});
const Usuarios = mongoose.model('usuarios', usuariosSchema);

export {Clientes, Productos, Pedidos, Usuarios};