const express = require("express");
const router = express.Router();
const bookController = require("./book.controller");

const { respondWithError } = require("../../utils/function");

const { verifyToken } = require("../auth/auth.actions");

async function GetBooks(req, res) {
  try {
    const resultadosBusqueda = await bookController.readBookWithFilters(
      req.query
    );
    res.status(200).json({ ...resultadosBusqueda });
  } catch (e) {
    respondWithError(res, e);
  }
}

async function PostBook(req, res) {
  try {
    req.body.dueño = req.userId;
    const createdBook = await bookController.createBook(req.body);

    res.status(201).json(
      createdBook // Devuelve el libro creado,
    );
  } catch (e) {
    respondWithError(res, e);
  }
}

async function GetBook(req, res) {
  try {
    const book = await bookController.readBookById(req.params.id);
    res.status(200).json(book);
  } catch (e) {
    respondWithError(res, e);
  }
}

async function UpdateBook(req, res) {
  try {
    const book = await bookController.updateBook(
      req.params.id,
      req.userId,
      req.body
    );
    res.status(200).json(book);
  } catch (e) {
    respondWithError(res, e);
  }
}

async function DeleteBook(req, res) {
  try {
    const book = await bookController.deleteBook(req.params.id, req.userId);
    res.status(200).json({ msg: "Libro eliminado", book });
  } catch (e) {
    respondWithError(res, e);
  }
}

router.get("/", GetBooks); //Obtener todos los libros
router.get("/:id", GetBook); //Obtener un libro
router.post("/", verifyToken, PostBook); //Crear un libro
router.patch("/update/:id", verifyToken, UpdateBook); //Actualizar un libro
router.patch("/delete/:id", verifyToken, DeleteBook); //Eliminar un libro

module.exports = router;