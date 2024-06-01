//Test Unitarios
//Test para verificar la creación de un pedido con datos válidos.
const { createOrder } = require('./order.controller');
const bookActions = require('./book.actions');
const orderActions = require('../src/order/order.actions');
const userActions = require('../src/user/user.actions');
const request = require('supertest');

jest.mock('../src/book/book.actions');
jest.mock('../src/order/order.actions');
jest.mock('../src/user/user.actions');

describe('createOrder - Unit Test', () => {
    it('should create an order successfully with valid data', async () => {
        bookActions.verifyOnlySalesman.mockResolvedValue(true);
        bookActions.getSeller.mockResolvedValue('sellerId');
        bookActions.getBooksTotalPrice.mockResolvedValue(100);
        orderActions.createOrder.mockResolvedValue({ _id: 'orderId' });
        userActions.putOrderInUser.mockResolvedValue(true);

        const data = {
            libros_ids: ['book1', 'book2'],
            comprador: 'buyerId',
            vendedor: 'sellerId',
            direccion_envio: '123 Main St',
            total: 100,
        };

        const result = await createOrder(data);

        expect(result).toHaveProperty('_id', 'orderId');
        expect(bookActions.changeStatusBooks).toHaveBeenCalledWith(data.libros_ids);
    });
});
//Test para verificar el manejo de error cuando se intenta comprar libros de diferentes vendedores.
describe('createOrder - Unit Test', () => {
    it('should throw an error when trying to buy books from different sellers', async () => {
        bookActions.verifyOnlySalesman.mockResolvedValue(false);

        const data = {
            libros_ids: ['book1', 'book2'],
            comprador: 'buyerId',
            direccion_envio: '123 Main St',
        };

        await expect(createOrder(data)).rejects.toThrow('Solo es posible comprar libros del mismo vendedor.');
    });
});
//Test de Integración
//Test para verificar la integración entre createOrder y la base de datos mockeada.
const dbMock = require('./testUtils/dbMock');

describe('createOrder - Integration Test', () => {
    beforeAll(async () => {
        await dbMock.connect();
    });

    afterAll(async () => {
        await dbMock.closeDatabase();
    });

    it('should create an order and return 200 status code', async () => {
        const response = await request(app)
            .post('/orders')
            .send({
                libros_ids: ['book1', 'book2'],
                comprador: 'buyerId',
                direccion_envio: '123 Main St',
            });

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('_id');
    });
});
//Test para verificar el manejo de datos inválidos en la creación de un pedido.
describe('createOrder - Integration Test', () => {
    it('should return 400 status code when provided with invalid data', async () => {
        const response = await request(app)
            .post('/orders')
            .send({
                // Datos inválidos o incompletos
            });

        expect(response.statusCode).toBe(400);
    });
});
//Test de End-to-End
//Test para verificar el flujo completo desde la creación hasta la consulta de un pedido.
describe('createOrder - E2E Test', () => {
    it('should create an order and then fetch the created order successfully', async () => {
        // Crear pedido
        const createResponse = await request(app)
            .post('/orders')
            .send({
                libros_ids: ['book1', 'book2'],
                comprador: 'buyerId',
                direccion_envio: '123 Main St',
            });

        expect(createResponse.statusCode).toBe(200);
        const orderId = createResponse.body._id;

        // Consultar pedido creado
        const fetchResponse = await request(app).get(`/orders/${orderId}`);
        expect(fetchResponse.statusCode).toBe(200);
        expect(fetchResponse.body).toHaveProperty('_id', orderId);
    });
});


///READ Pedido
//Tests Unitarios  
//Test para leer un pedido válido: Este test verificará que se pueda leer un pedido existente por su ID.
const { getOrder } = require('../src/order/order.controller');

test('Lee un pedido existente por ID', async () => {
    const mockOrder = { _id: '1', comprador: 'user1', vendedor: 'user2', estado: 'en progreso' };
    orderActions.getOrder.mockResolvedValue(mockOrder);

    const order = await getOrder('1', 'user1');
    expect(order).toEqual(mockOrder);
});
//Test para leer un pedido con ID inválido: Este test intentará leer un pedido con un ID que no existe, esperando recibir un error.
test('Intenta leer un pedido con ID inválido', async () => {
    orderActions.getOrder.mockResolvedValue(null);

    await expect(getOrder('invalidID', 'user1')).rejects.toThrow('El pedido no existe');
});
//Test para leer un pedido sin permisos: Este test intentará leer un pedido sin ser ni el comprador ni el vendedor, esperando recibir un error de permisos.
test('Intenta leer un pedido sin tener permisos', async () => {
    const mockOrder = { _id: '1', comprador: 'user1', vendedor: 'user2', estado: 'en progreso' };
    orderActions.getOrder.mockResolvedValue(mockOrder);
    orderActions.verifyUser.mockResolvedValue(false);

    await expect(getOrder('1', 'user3')).rejects.toThrow('No tienes permisos para realizar esta acción');
});
//Tests de Integración 
const app = require('../app');

test('Lee varios pedidos con filtros válidos', async () => {
    const response = await request(app).get('/orders?estado=en progreso');
    expect(response.statusCode).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
});
//Test para leer varios pedidos con filtros inválidos: Este test intentará leer varios pedidos aplicando filtros inválidos, esperando recibir un error.
test('Intenta leer varios pedidos con filtros inválidos', async () => {
    const response = await request(app).get('/orders?estado=invalido');
    expect(response.statusCode).toBe(400);
});
//Test de End-to-End  
test('Lee un pedido específico end-to-end', async () => {
    const response = await request(app).get('/order/1');
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('_id', '1');
});


///UPDATE Pedido
//Test Unitarios
//Test para verificar el cambio de estado a "cancelar" por el comprador:
const { orderActions } = require('../src/order/order.actions');

test('Cambio de estado a cancelar por el comprador', async () => {
  orderActions.getOrder.mockResolvedValue({
    _id: 'orderId',
    estado: 'en progreso',
    comprador: 'userId',
    save: jest.fn()
  });
  orderActions.verifyUser.mockResolvedValue(true);
  orderActions.updateOrderComprador.mockResolvedValue({
    estado: 'cancelar'
  });

  const result = await updateOrder('orderId', 'userId', { estado: 'cancelar' });
  expect(result.estado).toBe('cancelar');
});
//Test para verificar el cambio de estado a "completar" por el vendedor con estado inválido:
const { orderActions, throwCustomError } = require('../src/order/order.actions');

test('Intento de completar un pedido por el vendedor con estado inválido', async () => {
  orderActions.getOrder.mockResolvedValue({
    _id: 'orderId',
    estado: 'cancelado',
    vendedor: 'userId',
    save: jest.fn()
  });
  orderActions.verifyUser.mockResolvedValue(true);
  orderActions.updateOrderVendedor.mockImplementation(() => {
    throwCustomError(400, "El estado proporcionado es invalido.");
  });

  await expect(updateOrder('orderId', 'userId', { estado: 'completar' }))
    .rejects.toThrow("El estado proporcionado es invalido.");
});
//Test para verificar el error al intentar actualizar un pedido inexistente:
const { updateOrder } = require('../src/order/order.controller');

test('Actualizar un pedido inexistente', async () => {
  orderActions.getOrder.mockResolvedValue(null);

  await expect(updateOrder('orderId', 'userId', { estado: 'en progreso' }))
    .rejects.toThrow("El pedido no existe.");
});
//Test de Integración
//Test para verificar la actualización de un pedido a "cancelar" por el comprador:

test('Actualizar pedido a cancelar por el comprador', async () => {
  const response = await request(app)
    .put('/order/orderId')  
    .send({ estado: 'cancelar' })
    .set('userId', 'compradorId');

  expect(response.statusCode).toBe(200);
  expect(response.body.estado).toBe('cancelar');
});
//Test para verificar el error al actualizar un pedido con estado inválido:

test('Actualizar pedido con estado inválido', async () => {
  const response = await request(app)
    .put('/order/orderId')
    .send({ estado: 'invalido' })
    .set('userId', 'userId');

  expect(response.statusCode).toBe(400);
  expect(response.body.error).toBe("El estado proporcionado es invalido.");
});
//Test de End to End
//Test para verificar el flujo completo de actualización de un pedido a "cancelar":
const app = require('../src/app');
const { setupDatabase, orderOneId, userOneId } = require('./fixtures/db');

beforeEach(setupDatabase);

test('Actualizar pedido a cancelar - E2E', async () => {
  const response = await request(app)
    .put(`/order/${orderOneId}`)
    .send({ estado: 'cancelar' })
    .set('userId', `${userOneId}`);

  expect(response.statusCode).toBe(200);
  expect(response.body.estado).toBe('cancelar');
});

///DELETE Pedido
//Test Unitarios
//Test para verificar el comportamiento cuando el pedido no existe:
const { deleteOrder } = require('../src/order/order.controller');
const orderActions = require('../src/order/order.controller');


test('debe retornar error si el pedido no existe', async () => {
  orderActions.getOrder.mockResolvedValue(null);

  await expect(deleteOrder('idPedidoInexistente', 'userId')).rejects.toThrow('El pedido no existe');
});
//Test para verificar el comportamiento cuando el usuario no tiene permisos:
test('debe retornar error si el usuario no tiene permisos', async () => {
  orderActions.getOrder.mockResolvedValue({ comprador: 'otroUserId', vendedor: 'otroUserId' });
  orderActions.verifyUser.mockResolvedValue(false);

  await expect(deleteOrder('idPedidoExistente', 'userIdSinPermiso')).rejects.toThrow('No tiene permiso para realizar esta acción');
});
//Test para verificar el comportamiento cuando el pedido se elimina correctamente:
test('debe eliminar el pedido correctamente', async () => {
  orderActions.getOrder.mockResolvedValue({ _id: 'idPedidoExistente', comprador: 'userId', vendedor: 'userId' });
  orderActions.verifyUser.mockResolvedValue(true);
  orderActions.deleteOrder.mockResolvedValue({});

  await expect(deleteOrder('idPedidoExistente', 'userId')).resolves.toEqual({});
});
//Test de Integración
//Test para verificar la respuesta de la API cuando el pedido no existe:

test('DELETE /pedido/:id - Pedido no encontrado', async () => {
  const response = await request(app).delete('/pedido/idPedidoInexistente').set('Authorization', `Bearer tokenUsuario`);

  expect(response.statusCode).toBe(404);
  expect(response.body.message).toBe('El pedido no existe');
});
//Test para verificar la respuesta de la API cuando el pedido se elimina correctamente:
test('DELETE /pedido/:id - Pedido eliminado correctamente', async () => {
  const response = await request(app).delete('/pedido/idPedidoExistente').set('Authorization', `Bearer tokenUsuario`);

  expect(response.statusCode).toBe(200);
  expect(response.body.message).toBe('El pedido ha sido eliminado correctamente');
});
//Test de End-to-End
//Test para verificar el flujo completo desde la creación hasta la eliminación de un pedido:

test('E2E - Crear y eliminar un pedido', async () => {
  // Crear pedido
  let response = await request(app)
    .post('/pedido')
    .send({ /* datos del pedido */ })
    .set('Authorization', `Bearer tokenUsuario`);

  expect(response.statusCode).toBe(201);
  const pedidoId = response.body._id;

  // Eliminar pedido
  response = await request(app).delete(`/pedido/${pedidoId}`).set('Authorization', `Bearer tokenUsuario`);

  expect(response.statusCode).toBe(200);
  expect(response.body.message).toBe('El pedido ha sido eliminado correctamente');
});