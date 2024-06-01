//CREATE User  Invalido 3U  2I  1E2E)
//Test Unitarios
//Test para verificar la creación exitosa de un usuario:
const request = require('supertest');
const { registerUser } = require('../src/auth/auth.actions');
const User = require('../src/user/user.model');

jest.mock('../src/user/user.model');

describe('registerUser', () => {
  it('debe crear un usuario correctamente', async () => {
    User.mockImplementation(() => ({
      save: jest.fn().mockResolvedValue(true)
    }));
    const newUser = await registerUser({ nombre: 'Test', email: 'test@test.com', contraseña: '123456' });
    expect(newUser).toEqual({ message: "usuario creado exitosamente" });
  });
});
//Test para verificar el manejo de errores al crear un usuario:
describe('registerUser', () => {
  it('debe manejar errores si la creación del usuario falla', async () => {
    User.mockImplementation(() => ({
      save: jest.fn().mockRejectedValue(new Error('Error al crear usuario'))
    }));
    await expect(registerUser({ nombre: 'Test', email: 'test@test.com', contraseña: '123456' }))
      .rejects
      .toThrow('Error al crear usuario');
  });
});
//Test para verificar la validación de datos requeridos:
describe('registerUser', () => {
  it('debe fallar si falta un campo requerido', async () => {
    await expect(registerUser({ email: 'test@test.com', contraseña: '123456' }))
      .rejects
      .toThrow('nombre es requerido');
  });
});

//Test de Integración
//Test para verificar la respuesta del endpoint de creación de usuario:
const app = require('../app');

describe('POST /api/users', () => {
  it('debe crear un usuario y retornar un mensaje de éxito', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ nombre: 'Test', email: 'test@test.com', contraseña: '123456' });
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ message: "usuario creado exitosamente" });
  });
});

//Test para verificar la respuesta del endpoint con datos inválidos:
describe('POST /api/users', () => {
  it('debe retornar un error si falta un campo requerido', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ email: 'test@test.com', contraseña: '123456' });
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBeDefined();
  });
});

//Test de End to End 
//Test para verificar el flujo completo de creación de usuario:
describe('E2E Test - Creación de usuario', () => {
  it('debe crear un usuario y verificar en la base de datos', async () => {
    // Crear usuario
    const createUserResponse = await request(app)
      .post('/api/users')
      .send({ nombre: 'E2E Test', email: 'e2e@test.com', contraseña: '123456' });
    expect(createUserResponse.statusCode).toBe(200);

    // Verificar que el usuario existe en la base de datos
    const user = await User.findOne({ email: 'e2e@test.com' });
    expect(user).not.toBeNull();
    expect(user.nombre).toBe('E2E Test');
  });
});



//READ User
//Test 1: Obtener un usuario por ID válido

const userController = require('../src/user/user.controller');

jest.mock('../src/user/user.model');

test('Debería obtener un usuario por ID', async () => {
  const mockUser = { _id: '1', nombre: 'Juan', email: 'juan@example.com' };
  User.findById = jest.fn().mockResolvedValue(mockUser);

  const user = await userController.GetUserById('1');

  expect(user).toEqual(mockUser);
  expect(User.findById).toHaveBeenCalledWith('1');
});
//Test 2: Intentar obtener un usuario con un ID inexistente

test('Debería fallar al intentar obtener un usuario con un ID inexistente', async () => {
  User.findById = jest.fn().mockResolvedValue(null);

  await expect(userController.GetUserById('2')).rejects.toThrow('usuario no encontrado');
});
//Test 3: Obtener todos los usuarios

test('Debería obtener todos los usuarios', async () => {
  const mockUsers = [
    { _id: '1', nombre: 'Juan', email: 'juan@example.com' },
    { _id: '2', nombre: 'Ana', email: 'ana@example.com' }
  ];
  User.find = jest.fn().mockResolvedValue(mockUsers);

  const users = await userController.GetAllUsers();

  expect(users).toEqual(mockUsers);
  expect(User.find).toHaveBeenCalled();
});
//2. Tests de Integración (2 tests)

//Test 1: Obtener un usuario por ID a través de la API

test('Debería responder con un usuario específico', async () => {
  const response = await request(app).get('/user/1');
  expect(response.statusCode).toBe(200);
  expect(response.body).toHaveProperty('nombre');
});
//Test 2: Obtener un usuario con un ID inexistente a través de la API

test('Debería responder con un error al buscar un usuario inexistente', async () => {
  const response = await request(app).get('/user/999');
  expect(response.statusCode).toBe(404);
});
//3. Test de End-to-End (1 test)
//Para el test de end-to-end, se simulará un escenario completo desde la petición del cliente hasta la respuesta del servidor, incluyendo la interacción con la base de datos.

// Obtener un usuario por ID

const mongoose = require('mongoose');
const User = require('./user.model');

beforeAll(async () => {
  // Conectar a una base de datos de prueba
});

afterAll(async () => {
  // Cerrar la conexión a la base de datos y limpiar los datos de prueba
  await mongoose.connection.close();
});

test('E2E: Debería obtener un usuario por ID', async () => {
  const newUser = await User.create({ nombre: 'E2E Test User', email: 'e2e@test.com' });

  const response = await request(app).get(`/user/${newUser._id}`);
  expect(response.statusCode).toBe(200);
  expect(response.body).toHaveProperty('nombre', 'E2E Test User');
});


///
//Test Unitarios para Update User
//Test con datos válidos:
const { UpdateUser } = require('../src/user/user.model');
const userController = require('../src/user/user.controller');
jest.mock('../src/user/user.controller');

describe('UpdateUser - Unit Tests', () => {
  it('should update a user successfully with valid data', async () => {
    const req = {
      userId: '1',
      params: { id: '1' },
      body: { nombre: 'Updated Name' }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    userController.updateUser.mockResolvedValue(req.body);

    await UpdateUser(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      msg: "El usuario ha sido actualizado correctamente.",
      user: req.body
    });
  });
});
//Test con ID de usuario no coincidente (permisos insuficientes):
describe('UpdateUser - Unit Tests', () => {
  it('should return an error if user tries to update another user', async () => {
    const req = {
      userId: '1',
      params: { id: '2' },
      body: { nombre: 'Updated Name' }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await UpdateUser(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: "Permisos insuficientes para realizar esta acción."
    });
  });
});
//Test con datos inválidos (ejemplo: falta de nombre):
describe('UpdateUser - Unit Tests', () => {
  it('should return an error if required fields are missing', async () => {
    const req = {
      userId: '1',
      params: { id: '1' },
      body: {}
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    userController.updateUser.mockImplementation(() => {
      throw new Error('Datos inválidos');
    });

    await UpdateUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Datos inválidos"
    });
  });
});
//Test de Integración para UpdateUser
//Test con datos válidos:

describe('UpdateUser - Integration Test', () => {
  it('should update a user successfully with valid data', async () => {
    const response = await request(app)
      .patch('/user/update/1')
      .send({ nombre: 'Updated Name' })
      .set('Authorization', `Bearer token`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      msg: "El usuario ha sido actualizado correctamente.",
      user: expect.any(Object)
    });
  });
});
//Test con datos inválidos (ejemplo: falta de nombre):
describe('UpdateUser - Integration Test', () => {
  it('should return an error if required fields are missing', async () => {
    const response = await request(app)
      .patch('/user/update/1')
      .send({})
      .set('Authorization', `Bearer token`);

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('error');
  });
});
//Test de End-to-End para UpdateUser 
//Para el test de end-to-end, se asume que se tiene un entorno completo y se simula un escenario real desde el cliente hasta la base de datos.

const { MongoMemoryServer } = require('mongodb-memory-server');

describe('UpdateUser - End-to-End Test', () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it('should update a user successfully with valid data', async () => {
    // Crear un usuario para luego actualizarlo
    let response = await request(app)
      .post('/user/register')
      .send({ nombre: 'Test User', email: 'test@example.com', contraseña: 'password' });

    const userId = response.body.user.id;

    // Actualizar el usuario creado
    response = await request(app)
      .patch(`/user/update/${userId}`)
      .send({ nombre: 'Updated Name' })
      .set('Authorization', `Bearer token`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      msg: "El usuario ha sido actualizado correctamente.",
      user: expect.any(Object)
    });
  });
});

//DELETE User
//Test Unitarios
//Test para verificar el manejo de permisos insuficientes:
const { DeleteUser } = require('../src/user/user.route');
const { throwCustomError } = require('../utils/function');

jest.mock('../utils/function', () => ({
  throwCustomError: jest.fn(),
}));

describe('DeleteUser - Unit Tests', () => {
  it('should throw a permission error if user ID does not match', async () => {
    const req = {
      userId: '123',
      params: { id: '456' },
    };
    const res = {};

    await DeleteUser(req, res);

    expect(throwCustomError).toHaveBeenCalledWith(403, "Permisos insuficientes para realizar esta acción.");
  });
});
//Test para verificar la eliminación exitosa del usuario:
jest.mock('../src/user/user.controller', () => ({
  deleteUser: jest.fn().mockResolvedValue(true),
}));

it('should successfully delete a user', async () => {
  const req = {
    userId: '123',
    params: { id: '123' },
  };
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

  await DeleteUser(req, res);

  expect(res.status).toHaveBeenCalledWith(200);
  expect(res.json).toHaveBeenCalledWith({ message: "El usuario ha sido eliminado correctamente." });
});
//Test para manejar errores inesperados:
jest.mock('../utils/function', () => ({
  respondWithError: jest.fn(),
}));

it('should handle unexpected errors', async () => {
  const req = {
    userId: '123',
    params: { id: '123' },
  };
  const res = {};
  const error = new Error('Unexpected error');

  userController.deleteUser.mockRejectedValue(error);

  await DeleteUser(req, res);

  expect(respondWithError).toHaveBeenCalledWith(res, error);
});
//Test de Integración
//Test para verificar la respuesta con credenciales incorrectas:

describe('DeleteUser - Integration Tests', () => {
  it('should return a 403 error for invalid user ID', async () => {
    const response = await request(app)
      .delete('/user/delete/456')
      .set('Authorization', 'Bearer token_de_un_usuario_diferente');

    expect(response.statusCode).toBe(403);
    expect(response.body).toEqual({ error: "Permisos insuficientes para realizar esta acción." });
  });
});
//Test para verificar la eliminación exitosa del usuario:
it('should delete a user successfully', async () => {
  const response = await request(app)
    .delete('/user/delete/123') 
    .set('Authorization', 'Bearer token_del_usuario_correcto');

  expect(response.statusCode).toBe(200);
  expect(response.body).toEqual({ message: "El usuario ha sido eliminado correctamente." });
});
//Test de End-to-End
//Test para verificar el flujo completo de eliminación de un usuario:
it('should complete the end-to-end flow of deleting a user', async () => {
  // Primero, crear un usuario para luego eliminarlo
  let response = await request(app)
    .post('/user/register')
    .send({ nombre: 'Test User', email: 'test@example.com', contraseña: 'password123' });

  const userId = response.body.user.id;
  const token = response.body.token;

  // Ahora, eliminar el usuario creado
  response = await request(app)
    .delete(`/user/delete/${userId}`)
    .set('Authorization', `Bearer ${token}`);

  expect(response.statusCode).toBe(200);
  expect(response.body).toEqual({ message: "El usuario ha sido eliminado correctamente." });
});