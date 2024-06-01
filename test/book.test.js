//Test Unitarios para CREATE Libro
//Test para verificar la creación exitosa de un libro:
const { createBook } = require('../src/book/book.actions');
const Book = require('../src/book/book.model');

jest.mock('../src/book/book.model');

test('Crear un libro exitosamente', async () => {
    const mockBook = {
        titulo: 'Libro de Prueba',
        autor: 'Autor Prueba',
        genero: 'Genero Prueba',
        fecha_publicacion: new Date(),
        casa_editorial: 'Editorial Prueba',
        precio: 100,
    };

    Book.create.mockResolvedValue(mockBook);

    await expect(createBook(mockBook)).resolves.toEqual(mockBook);
});
//Test para verificar la falla al crear un libro sin título:
test('Falla al crear un libro sin título', async () => {
    const mockBook = {
        autor: 'Autor Prueba',
        genero: 'Genero Prueba',
        fecha_publicacion: new Date(),
        casa_editorial: 'Editorial Prueba',
        precio: 100,
    };

    await expect(createBook(mockBook)).rejects.toThrow();
});
//Test para verificar la falla al crear un libro con precio negativo:
test('Falla al crear un libro con precio negativo', async () => {
    const mockBook = {
        titulo: 'Libro de Prueba',
        autor: 'Autor Prueba',
        genero: 'Genero Prueba',
        fecha_publicacion: new Date(),
        casa_editorial: 'Editorial Prueba',
        precio: -100,
    };

    await expect(createBook(mockBook)).rejects.toThrow();
});
//Test de Integración 
//Test para verificar la respuesta del endpoint al crear un libro:
const request = require('supertest');
const app = require('../app');

test('Endpoint de creación de libro devuelve 201 para libro creado', async () => {
    const mockBook = {
        titulo: 'Libro de Prueba',
        autor: 'Autor Prueba',
        genero: 'Genero Prueba',
        fecha_publicacion: new Date(),
        casa_editorial: 'Editorial Prueba',
        precio: 100,
    };

    await request(app)
        .post('/books')
        .send(mockBook)
        .expect(201);
});
//Test para verificar la respuesta del endpoint al intentar crear un libro sin título:
test('Endpoint de creación de libro devuelve 400 para solicitud sin título', async () => {
    const mockBook = {
        autor: 'Autor Prueba',
        genero: 'Genero Prueba',
        fecha_publicacion: new Date(),
        casa_editorial: 'Editorial Prueba',
        precio: 100,
    };

    await request(app)
        .post('/books')
        .send(mockBook)
        .expect(400);
});//
//Test de End-to-End para CREATE Libro
//Test para verificar el flujo completo de creación de un libro:
test('Flujo completo de creación de un libro', async () => {
    const mockBook = {
        titulo: 'Libro de Prueba E2E',
        autor: 'Autor Prueba E2E',
        genero: 'Genero Prueba E2E',
        fecha_publicacion: new Date(),
        casa_editorial: 'Editorial Prueba E2E',
        precio: 150,
    };

    const response = await request(app)
        .post('/books')
        .send(mockBook);

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('titulo', mockBook.titulo);
});


/// Read libro
//Test Unitarios  
//1. Test para leer un libro por ID con datos válidos

const bookActions = require('../src/book/book.actions');


test('Debería obtener un libro por ID', async () => {
    const mockBook = { _id: '1', titulo: 'Libro de Prueba', autor: 'Autor', genero: 'Ficción' };
    Book.findById = jest.fn().mockResolvedValue(mockBook);

    const book = await bookActions.getBookById('1');
    expect(book).toEqual(mockBook);
    expect(Book.findById).toHaveBeenCalledWith('1');
});
//2. Test para leer un libro por ID con datos inválidos (libro no encontrado)

test('Debería fallar al obtener un libro por un ID inexistente', async () => {
    Book.findById = jest.fn().mockResolvedValue(null);

    await expect(bookActions.getBookById('999')).rejects.toThrow('Libro no encontrado');
    expect(Book.findById).toHaveBeenCalledWith('999');
});
//3. Test para leer múltiples libros filtrados por género

test('Debería obtener libros filtrados por género', async () => {
    const mockBooks = [
        { _id: '1', titulo: 'Libro de Prueba 1', autor: 'Autor 1', genero: 'Ficción' },
        { _id: '2', titulo: 'Libro de Prueba 2', autor: 'Autor 2', genero: 'Ficción' }
    ];
    Book.find = jest.fn().mockResolvedValue(mockBooks);

    const books = await bookActions.getBooksByGenre('Ficción');
    expect(books).toEqual(mockBooks);
    expect(Book.find).toHaveBeenCalledWith({ genero: 'Ficción' });
});
//Test de Integración 
//1. Test para verificar la respuesta de la API al solicitar un libro por ID

const app = require('../src/app');

test('Debería responder con un libro específico', async () => {
    const response = await request(app).get('/api/books/1');
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('titulo');
    expect(response.body).toHaveProperty('autor');
});
//2. Test para verificar la respuesta de la API al solicitar libros por género con datos inválidos

test('Debería responder con un error al solicitar libros de un género inexistente', async () => {
    const response = await request(app).get('/api/books?genero=NoExiste');
    expect(response.statusCode).toBe(404);
});
//Test de End-to-End  
//1. Test E2E para verificar el flujo completo de la lectura de libros

const app = require('../src/app');
const { setupDatabase } = require('./fixtures/db');

beforeEach(setupDatabase);

test('Debería obtener libros y filtrar por género', async () => {
    const response = await request(app).get('/api/books?genero=Ficción');
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveLength(2);
});



//Update libro
//Test Unitarios
//Test para verificar que se lanza un error cuando el libro no existe.
const { updateBook } = require('../src/book/book.controller');
const { getBookById } = require('../src/book/book.actions');

jest.mock('../src/book/book.actions', () => ({
    getBookById: jest.fn(),
}));

test('Lanza un error cuando el libro no existe', async () => {
    getBookById.mockResolvedValue(null);
    await expect(updateBook('fakeId', 'userId', {})).rejects.toThrow('Libro no encontrado');
});
//Test para verificar que se lanza un error cuando el usuario no es el dueño del libro.
const mongoose = require('mongoose');

getBookById.mockResolvedValue({
    _id: new mongoose.Types.ObjectId(),
    dueño: new mongoose.Types.ObjectId('differentUserId'),
});

test('Lanza un error cuando el usuario no es el dueño del libro', async () => {
    await expect(updateBook('bookId', 'userId', {})).rejects.toThrow('No eres el dueño de este libro');
});
//Test para verificar que se actualiza el libro correctamente.
const { updateBook } = require('../src/book/book.actions');

jest.mock('../src/book/book.actions', () => ({
    getBookById: jest.fn(),
    updateBook: jest.fn(),
}));

getBookById.mockResolvedValue({
    _id: 'bookId',
    dueño: 'userId',
});

updateBook.mockResolvedValue({
    _id: 'bookId',
    titulo: 'Nuevo Título',
});

test('Actualiza el libro correctamente', async () => {
    const updatedBook = await updateBook('bookId', 'userId', { titulo: 'Nuevo Título' });
    expect(updatedBook.titulo).toBe('Nuevo Título');
});
//Test de Integración
//Test para verificar que se actualiza un libro existente con datos válidos.

test('Actualiza un libro existente con datos válidos', async () => {
    const response = await request(app)
        .put('/book/bookId')
        .send({ titulo: 'Nuevo Título Actualizado' })
        .set('Authorization', `Bearer tokenUsuarioDueño`);
    expect(response.statusCode).toBe(200);
    expect(response.body.titulo).toBe('Nuevo Título Actualizado');
});
//Test para verificar que se lanza un error al intentar actualizar un libro con datos inválidos.
test('Lanza un error al intentar actualizar un libro con datos inválidos', async () => {
    const response = await request(app)
        .put('/book/bookId')
        .send({ precio: -10 }) // Precio inválido
        .set('Authorization', `Bearer tokenUsuarioDueño`);
    expect(response.statusCode).toBe(400);
});
//Test de End to End
//Test para verificar el flujo completo de actualizar un libro desde la petición hasta la base de datos.
//Este test implica realizar una petición para actualizar un libro y luego verificar directamente en la base de datos que el libro se haya actualizado correctamente. Para este test, se asume que se tiene acceso a la base de datos para realizar la verificación.

const { Book } = require('../src/book/book.model');

test('Actualiza un libro y verifica en la base de datos', async () => {
    const newTitle = 'Título Final';
    await request(app)
        .put('/book/bookId')
        .send({ titulo: newTitle })
        .set('Authorization', `Bearer tokenUsuarioDueño`);

    const updatedBook = await Book.findById('bookId');
    expect(updatedBook.titulo).toBe(newTitle);
});


///Delete libro
//Pruebas Unitarias
//Libro no encontrado: Verificar que se maneje correctamente cuando el libro a eliminar no existe.
const { deleteBook } = require('../src/book/book.controller');
const { getBookById } = require('../src/book/book.actions');

jest.mock('../src/book/book.actions', () => ({
    getBookById: jest.fn(),
}));

test('Libro no encontrado', async () => {
    getBookById.mockResolvedValue(null);
    await expect(deleteBook('fakeId', 'userId')).rejects.toThrow('Libro no encontrado');
});
//Usuario no es el dueño del libro: Verificar que se maneje correctamente cuando el usuario que intenta eliminar el libro no es el dueño.
const { deleteBook } = require('../src/book/book.controller');
const { getBookById } = require('../src/book/book.actions');

test('Usuario no es el dueño del libro', async () => {
    getBookById.mockResolvedValue({ dueño: 'anotherUserId' });
    await expect(deleteBook('bookId', 'userId')).rejects.toThrow('No eres el titular de este libro');
});
//Libro eliminado correctamente: Verificar que el libro se marca como eliminado correctamente.
const { deleteBook } = require('./book.controller');
const { getBookById, changeStatusBook } = require('./book.actions');

jest.mock('./book.actions', () => ({
    getBookById: jest.fn(),
    changeStatusBook: jest.fn(),
}));

test('Libro eliminado correctamente', async () => {
    getBookById.mockResolvedValue({ dueño: 'userId', _id: 'bookId' });
    changeStatusBook.mockResolvedValue(true);
    const result = await deleteBook('bookId', 'userId');
    expect(result).toBeTruthy();
});
//Pruebas de Integración
//Eliminar libro con datos válidos: Verificar que el endpoint elimina el libro correctamente.

test('Eliminar libro con datos válidos', async () => {
    const response = await request(app)
        .delete('/book/bookId')
        .set('Authorization', `Bearer tokenUsuarioValido`);
    expect(response.statusCode).toBe(200);
    expect(response.body.msg).toBe('Libro eliminado');
});
//Intentar eliminar libro con datos inválidos: Verificar que el endpoint maneja correctamente los datos inválidos.

test('Intentar eliminar libro con datos inválidos', async () => {
    const response = await request(app)
        .delete('/book/idInvalido')
        .set('Authorization', `Bearer tokenUsuarioInvalido`);
    expect(response.statusCode).toBe(404);
});
//Prueba End-to-End
//Flujo completo de eliminación de libro: Verificar el flujo completo desde la creación hasta la eliminación del libro.

test('Flujo completo de eliminación de libro', async () => {
    // Crear un libro primero
    let response = await request(app)
        .post('/book')
        .send({ titulo: 'Libro de Prueba', autor: 'Autor', genero: 'Genero', fecha_publicacion: '2023-01-01', casa_editorial: 'Editorial', precio: 100 })
        .set('Authorization', `Bearer tokenUsuarioValido`);

    const bookId = response.body._id;

    // Eliminar el libro creado
    response = await request(app)
        .delete(`/book/${bookId}`)
        .set('Authorization', `Bearer tokenUsuarioValido`);

    expect(response.statusCode).toBe(200);
    expect(response.body.msg).toBe('Libro eliminado');
});
