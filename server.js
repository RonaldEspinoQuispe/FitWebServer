const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
require('dotenv').config(); // Cargar variables de entorno desde .env

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Conectar a MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('Conectado a MongoDB Atlas'))
.catch(err => console.error('Error conectando a MongoDB Atlas:', err));

// Definir el esquema de los ejercicios
const ejercicioSchema = new mongoose.Schema({
    date: String,
    exercise: String,
    muscleGroup: String,
    series: [
        {
            subseries: {
                repetitions: Number,
                weight: Number,
                notes: String,
            },
            dropset: Boolean,
            dropsetAmount: Number,
            dropsets: [
                {
                    repetitions: Number,
                    weight: Number,
                    notes: String,
                },
            ],
        },
    ],
});

const Ejercicio = mongoose.model("Ejercicio", ejercicioSchema);

// Rutas CRUD

// Crear un nuevo ejercicio
app.post("/ejercicios", async (req, res) => {
    try {
        const nuevoEjercicio = new Ejercicio(req.body);
        await nuevoEjercicio.save();
        res.status(201).send(nuevoEjercicio);
    } catch (error) {
        res.status(400).send(error);
    }
});

// Obtener todos los ejercicios
app.get("/ejercicios", async (req, res) => {
    try {
        const ejercicios = await Ejercicio.find();
        res.status(200).send(ejercicios);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Actualizar un ejercicio por ID
app.put("/ejercicios/:id", async (req, res) => {
    try {
        const ejercicio = await Ejercicio.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
        });
        res.status(200).send(ejercicio);
    } catch (error) {
        res.status(400).send(error);
    }
});

//Actualizar un registro 
app.put("/ejercicios", async (req, res) => {
    const { date, exercise, muscleGroup, series } = req.body;

    console.log("Datos recibidos:", { date, exercise, muscleGroup, series }); // Verificar los datos recibidos

    try {
        // Actualizar el registro en la base de datos
        const result = await Ejercicio.updateOne(
            { date, exercise }, // Filtro para encontrar el registro
            { $set: { muscleGroup, series } } // Nuevos valores
        );

        console.log("Resultado de la actualización:", result); // Verificar el resultado

        if (result.modifiedCount === 0) {
            return res.status(404).json({ message: "Registro no encontrado" });
        }
        res.status(200).json({ message: "Registro actualizado correctamente" });
    } catch (error) {
        console.error("Error al actualizar el registro:", error);
        res.status(500).json({ message: "Error al actualizar el registro" });
    }
});

// Eliminar un ejercicio por date y exercise
app.delete("/ejercicios", async (req, res) => {
    const { date, exercise } = req.body;

    try {
        // Eliminar el registro de la base de datos
        const result = await Ejercicio.deleteOne({ date, exercise });
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "Registro no encontrado" });
        }
        res.status(200).json({ message: "Registro eliminado correctamente" });
    } catch (error) {
        console.error("Error al eliminar el registro:", error);
        res.status(500).json({ message: "Error al eliminar el registro" });
    }
});

// Eliminar un ejercicio por ID
app.delete("/ejercicios/:id", async (req, res) => {
    try {
        await Ejercicio.findByIdAndDelete(req.params.id);
        res.status(200).send({ message: "Ejercicio eliminado" });
    } catch (error) {
        res.status(500).send(error);
    }
});

// Endpoint para limpiar la colección completa
app.delete("/ejercicios", async (req, res) => {
    try {
        // Eliminar todos los documentos de la colección
        await Ejercicio.deleteMany({});
        res.status(200).send({ message: "Todos los ejercicios han sido eliminados" });
    } catch (error) {
        res.status(500).send(error);
    }
});

const datos_ejercicios = mongoose.model("datos_ejercicios", ejercicioSchema);

// Ruta para obtener ejercicios por grupo muscular
app.get("/api/exercises", async (req, res) => {
    const { muscleGroup } = req.query;

    if (!muscleGroup) {
        return res.status(400).json({ error: "Grupo muscular no proporcionado" });
    }

    try {
        const exercises = await datos_ejercicios.find({ muscleGroup });
        res.json(exercises);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener los ejercicios" });
    }
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});