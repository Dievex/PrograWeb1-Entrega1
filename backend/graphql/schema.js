const { gql } = require('graphql-tag');

const typeDefs = gql`
  type Product {
    id: ID!
    nombre: String!
    precio: Float!
    descripcion: String
    imagenUrl: String
  }

  type OrderItem {
    product: Product
    quantity: Int!
    price: Float!
  }

  type Order {
    id: ID!
    user: User
    items: [OrderItem]!
    total: Float!
    status: String!
    createdAt: String
  }

  type User {
    id: ID!
    nombre: String
    email: String
    role: String
  }

  type Query {
    products: [Product]
    product(id: ID!): Product
    orders(status: String): [Order]
    order(id: ID!): Order
    users: [User]
  }

  input CartItemInput {
    productId: ID!
    quantity: Int!
  }

  input CreateOrderInput {
    items: [CartItemInput]!
  }

  type Mutation {
    createOrder(input: CreateOrderInput!): Order
    updateOrderStatus(id: ID!, status: String!): Order
    deleteUser(id: ID!): String
    toggleUserRole(id: ID!): User
  }
`;

module.exports = typeDefs;
