const bookActions = require("./book.actions");
const { throwCustomError } = require("../../utils/function");

async function createBook(data) {
  const CreatedBook = await bookActions.createBook(data);
  return CreatedBook;
}

async function readBookWithFilters(filters) {
  const resultadosBusqueda = await bookActions.getBooks(filters);
  return resultadosBusqueda;
}

async function readBookById(id) {
  const book = await bookActions.getBookById(id);
  return book;
}

async function updateBook(id, userId, data) {
  const book = await bookActions.getBookById(id);
  if (!book) {
    return throwCustomError(404, "Libro no encontrado");
  }
  if (!book.dueño.equals(userId)) {
    return throwCustomError(403, "No eres el dueño de este libro");
  }
  const updatedBook = await bookActions.updateBook(book._id, data);
  return updatedBook;
}

async function deleteBook(id, userId) {
  const book = await bookActions.getBookById(id);
  if (!book) {
    return throwCustomError(404, "Libro no encontrado");
  }
  if (!book.dueño.equals(userId)) {
    return throwCustomError(403, "No eres el titular de este libro");
  }

  await bookActions.changeStatusBook(book);
  return book;
}

module.exports = {
  createBook,
  readBookWithFilters,
  readBookById,
  updateBook,
  deleteBook,
};