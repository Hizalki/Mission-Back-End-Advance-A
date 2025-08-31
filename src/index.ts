import express from 'express';
import { PrismaClient } from '@prisma/client';

const app = express();
const PORT = 3000;
const prisma = new PrismaClient();

app.use(express.json());

//CREATE
app.post('/users', async (req, res, next) => {
    const { fullname, username, password, email } = req.body;
    const result = await prisma.users.create({
        data: {
            fullname: fullname,
            username: username,
            password: password,
            email: email
        }
    })
    res.json({
        data: result,
        message: 'User created successfully'
    })
});

// READ
app.get('/users', async (req, res, next) => {
    const users = await prisma.users.findMany();
    res.json({
        data: users,
        message: 'User list retrieved successfully'
    })
});

// UPDATE
app.patch('/users/:id', async (req, res, next) => {
    const { id } = req.params;
    const { fullname, username, password, email } = req.body;
    const result = await prisma.users.update({
        where: { id: Number(id) },
        data: {
            fullname: fullname,
            username: username,
            password: password,
            email: email
        }
    })
    res.json({
        data: result,
        message: `User ${id} successfully updated`
    })
});

// DELETE
app.delete('/users/:id', async (req, res, next) => {
    const { id } = req.params;
    await prisma.users.delete({
        where: { id: Number(id) }
    })
    res.json({
        message: `User ${id} successfully deleted`
    })
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});