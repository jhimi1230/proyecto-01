const User = require("../user/user.model");
const jwt = require("jsonwebtoken");
const config = require("../../config");
const { respondWithError, throwCustomError } = require("../../utils/function");
const bcrypt = require("bcryptjs");

async function registerUser(data) {
  const { nombre, email, contraseña } = data;

  const newUser = new User({
    nombre,
    email,
    contraseña,
  });

  await newUser.save();

  return { message: "usuario creado exitosamente" };
}

async function encryptPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

async function comparePassword(password, receivedPassword) {
  return await bcrypt.compare(password, receivedPassword);
}

async function loginUser(data) {
  const { email, password } = data;

  const userFound = await User.findOne({ email: email });

  if (!userFound) {
    return throwCustomError(404, "usuario no encontrado");
  }

  const matchPassword = await comparePassword(password, userFound.password);

  if (!matchPassword) return throwCustomError(401, "contraseña incorrecta, intente de nuevo");

  const token = jwt.sign({ id: userFound._id }, config.SECRET, {
    expiresIn: 43200, // 12 horas
  });

  return { token };
}

async function verifyToken(req, res, next) {
  try {
    const token = req.headers["x-access-token"];

    if (!token) return throwCustomError(403, "No se recibio ningun token ");

    const decoded = await jwt.verify(token, config.SECRET);
    req.userId = decoded.id;

    const user = await User.findById(req.userId, { contraseña: 0 });
    if (!user) return throwCustomError(404, "Usuario no encontrado");
    next();
  } catch (error) {
    throwCustomError(401, "No autorizado");
  }
}

module.exports = { registerUser, loginUser, verifyToken, encryptPassword };