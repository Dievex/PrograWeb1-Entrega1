const Producto = require('../models/Producto');
const Orden = require('../models/Orden');
const Usuario = require('../models/Usuario');

const resolvers = {
  Query: {
    products: async () => {
      return await Producto.find();
    },
    product: async (_, { id }) => {
      return await Producto.findById(id);
    },
    orders: async (_, { status }, context) => {
      if (!context.user) throw new Error('No autenticado');
      
      let filter = {};
      if (status) {
        filter.status = status;
      }

      // Si es admin, ve todos (o filtrados). Si es user, solo los suyos.
      if (context.user.role !== 'admin') {
        filter.user = context.user.id; // id viene del token decodificado
      }

      return await Orden.find(filter).populate('user').populate('items.product').sort({ createdAt: -1 });
    },
    order: async (_, { id }, context) => {
      if (!context.user) throw new Error('No autenticado');
      const order = await Orden.findById(id).populate('user').populate('items.product');
      if (!order) throw new Error('Pedido no encontrado');

      if (context.user.role !== 'admin' && order.user._id.toString() !== context.user.id) {
        throw new Error('No autorizado');
      }
      return order;
    },
    users: async (_, __, context) => {
      if (!context.user || context.user.role !== 'admin') throw new Error('No autorizado');
      return await Usuario.find();
    },
  },
  Mutation: {
    createOrder: async (_, { input }, context) => {
      if (!context.user) throw new Error('No autenticado');
      const { items } = input;
      
      let total = 0;
      const orderItems = [];

      for (const item of items) {
        const product = await Producto.findById(item.productId);
        if (!product) throw new Error(`Producto ${item.productId} no encontrado`);
        
        const price = product.precio;
        const quantity = item.quantity;
        total += price * quantity;

        orderItems.push({
          product: item.productId,
          quantity,
          price
        });
      }

      const newOrder = new Orden({
        user: context.user.id,
        items: orderItems,
        total,
        status: 'PENDING'
      });

      await newOrder.save();
      return await newOrder.populate('user');
    },
    updateOrderStatus: async (_, { id, status }, context) => {
      if (!context.user || context.user.role !== 'admin') throw new Error('No autorizado');
      const order = await Orden.findByIdAndUpdate(id, { status }, { new: true }).populate('user').populate('items.product');
      return order;
    },
    deleteUser: async (_, { id }, context) => {
      if (!context.user || context.user.role !== 'admin') throw new Error('No autorizado');
      await Usuario.findByIdAndDelete(id);
      return "Usuario eliminado";
    },
    toggleUserRole: async (_, { id }, context) => {
      if (!context.user || context.user.role !== 'admin') throw new Error('No autorizado');
      const user = await Usuario.findById(id);
      if (!user) throw new Error('Usuario no encontrado');
      
      user.role = user.role === 'admin' ? 'user' : 'admin';
      await user.save();
      return user;
    }
  }
};

module.exports = resolvers;
